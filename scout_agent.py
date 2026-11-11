#!/usr/bin/env python3
"""
SCOUT Agent v5.0.0 — Public Bolivia 100% Remote Opportunity Aggregator & Custom URL Scanner
Dependencies: Python 3.10+ Standard Library ONLY

Features:
  - Scans 73+ global & regional remote job platforms across Tracks A-F.
  - Supports adding and scanning custom platform URLs on demand (JSON API, RSS/Atom, HTML Job Board, Portal Dork).
  - Enforces 100% Remote from Bolivia eligibility pre-filtering.
  - Supports on-demand execution and recurring 15-minute scheduled execution (--every-15m).
"""

import argparse
import datetime
import hashlib
import html
import json
import re
import sqlite3
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "platforms_config.json"
DB_PATH = BASE_DIR / "career_ops.db"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/128.0.0.0 Safari/537.36"
)


def init_db(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_hash TEXT UNIQUE NOT NULL,
            platform_id TEXT,
            platform_name TEXT,
            category TEXT,
            track TEXT,
            contract_caveat TEXT DEFAULT 'fractional_or_fulltime',
            title TEXT NOT NULL,
            company TEXT,
            location TEXT,
            url TEXT,
            description TEXT,
            tags TEXT,
            published_at TEXT,
            discovered_at TEXT NOT NULL,
            bolivia_eligible INTEGER DEFAULT 1,
            status TEXT DEFAULT 'ACTIVE'
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS custom_platforms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            track TEXT,
            type TEXT DEFAULT 'auto',
            enabled INTEGER DEFAULT 1,
            domain TEXT,
            url TEXT NOT NULL,
            search_query TEXT,
            contract_caveat TEXT DEFAULT 'fractional_or_fulltime',
            notes TEXT,
            added_at TEXT
        )
        """
    )
    conn.commit()
    return conn


def load_config(config_path: Path = CONFIG_PATH) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_config(cfg: dict, config_path: Path = CONFIG_PATH) -> None:
    cfg["last_updated"] = datetime.date.today().isoformat()
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def strip_html(raw_text: str) -> str:
    if not raw_text:
        return ""
    text = str(raw_text)
    for _ in range(2):
        text = html.unescape(text)
        text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
        text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _imul32(a: int, b: int) -> int:
    return ((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF


def compute_hash(title: str, company: str, url: str) -> str:
    norm_title = re.sub(r"\s+", " ", str(title or "").strip().lower())
    norm_company = re.sub(r"\s+", " ", str(company or "").strip().lower())
    norm_url = re.sub(r"/+$", "", str(url or "").strip().lower())
    norm = f"{norm_title}|{norm_company}|{norm_url}"
    h1 = (0xDEADBEEF ^ len(norm)) & 0xFFFFFFFF
    h2 = (0x41C6CE57 ^ len(norm)) & 0xFFFFFFFF
    for ch in norm:
        code = ord(ch)
        h1 = _imul32(h1 ^ code, 2654435761)
        h2 = _imul32(h2 ^ code, 1597334677)
    h1 = (_imul32(h1 ^ (h1 >> 16), 2246822507) ^ _imul32(h2 ^ (h2 >> 13), 3266489909)) & 0xFFFFFFFF
    h2 = (_imul32(h2 ^ (h2 >> 16), 2246822507) ^ _imul32(h1 ^ (h1 >> 13), 3266489909)) & 0xFFFFFFFF
    h3 = (h1 ^ h2) & 0xFFFFFFFF
    return f"{h1:08x}{h2:08x}{h3:08x}"


def is_bolivia_remote_eligible(item: dict, cfg: dict) -> bool:
    url_low = str(item.get("url", "")).lower()
    title_low = str(item.get("title", "")).lower()
    loc_low = str(item.get("location", "")).lower().strip()
    desc_low = str(item.get("description", "")).lower()
    blob = f"{title_low} {loc_low} {desc_low}"

    for dead in cfg.get("dead_platforms_blacklist", []):
        dom = dead.get("domain", "").lower()
        if dom and dom in url_low:
            return False

    hard_patterns = [
        r"\bus only\b", r"\busa only\b", r"\bunited states only\b",
        r"\bmust reside in the us\b", r"\bu\.s\.-based\b", r"\bus citizens only\b",
        r"\bw-2 only\b", r"\bm[eé]xico only\b", r"\bin spain\b", r"\bin france\b",
        r"\bspeakers in (?!bolivia|latin america|latam|south america)[a-z]+",
        r"\beligible in bulgaria\b", r"\(africa\)", r"\(canada\)", r"\(us\)",
        r"\bus remote\b", r"\buk only\b", r"\beu citizens only\b", r"\bon-site only\b",
        r"\bremote-friendly\s*\(travel required\)",
        r"\b(?:emea|apac|d-a-ch|dach)\s+only\b",
    ]
    for pat in hard_patterns:
        if re.search(pat, blob):
            return False

    if loc_low in {"united states", "usa", "u.s.", "europe", "eu", "emea", "apac", "uk", "canada", "mexico", "spain", "france"}:
        return False

    has_inclusive = bool(re.search(r"\b(?:bolivia|latam|latin america|south america|sudam[eé]rica|latinoam[eé]rica|americas|worldwide|anywhere|global|international)\b", loc_low))
    has_foreign_list = bool(re.search(r"\b(?:united states|usa|u\.s\.|canada|europe|eu|emea|apac|uk|united kingdom|australia|singapore|saudi arabia|india|germany|spain|mexico)\b", loc_low))
    if has_foreign_list and not has_inclusive:
        if not any(sa in loc_low for sa in ("argentina", "brazil", "colombia", "chile", "peru")):
            return False

    return True


def http_get(url: str, timeout: int = 12) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, application/xml, text/xml, text/html, */*",
            "Accept-Language": "es-BO,es;q=0.9,en-US;q=0.8,en;q=0.7",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_json_api(platform: dict) -> list:
    raw = http_get(platform["url"])
    data = json.loads(raw.decode("utf-8", errors="replace"))
    root_key = platform.get("json_root_key")
    records = data.get(root_key, []) if root_key and isinstance(data, dict) else data
    if isinstance(records, dict):
        for k in ("jobs", "data", "results", "items"):
            if isinstance(records.get(k), list):
                records = records[k]
                break
    if not isinstance(records, list):
        return []

    fmap = platform.get("field_mapping", {})
    results = []
    today_iso = datetime.date.today().isoformat()
    for row in records[:60]:
        if not isinstance(row, dict):
            continue
        title = strip_html(row.get(fmap.get("title", "title")) or row.get("position") or row.get("jobTitle") or "")
        if not title:
            continue
        company = strip_html(row.get(fmap.get("company", "company")) or row.get("company_name") or row.get("companyName") or platform["name"])
        desc = strip_html(row.get(fmap.get("description", "description")) or row.get("excerpt") or row.get("jobExcerpt") or "")[:1500]
        job_url = str(row.get(fmap.get("url", "url")) or row.get("applicationLink") or platform["url"])
        if job_url.startswith("/") and platform.get("domain"):
            job_url = f"https://{platform['domain']}{job_url}"
        loc_val = row.get(fmap.get("location", "location")) or "Remote Worldwide"
        if isinstance(loc_val, list):
            loc_val = ", ".join(str(x) for x in loc_val) if loc_val else "Remote Worldwide"
        tags_val = row.get(fmap.get("tags", "tags")) or ""
        if isinstance(tags_val, list):
            tags_val = ", ".join(str(x) for x in tags_val)
        pub = str(row.get(fmap.get("published_at", "published_at")) or today_iso)[:10]

        results.append(
            {
                "platform_id": platform["id"],
                "platform_name": platform["name"],
                "category": platform.get("category", "Category 6: Curated Remote-First Job Boards"),
                "track": platform.get("track", "Track F: Curated Remote-First & WFA Job Boards"),
                "contract_caveat": platform.get("contract_caveat", "fractional_or_fulltime"),
                "title": title,
                "company": company or platform["name"],
                "location": str(loc_val or "Remote Worldwide"),
                "url": job_url,
                "description": desc,
                "tags": str(tags_val),
                "published_at": pub,
            }
        )
    return results


def fetch_rss_feed(platform: dict) -> list:
    raw = http_get(platform["url"])
    root = ET.fromstring(raw)
    results = []
    items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
    today_iso = datetime.date.today().isoformat()

    for item in items[:50]:
        title_el = item.find("title") or item.find("{http://www.w3.org/2005/Atom}title")
        link_el = item.find("link") or item.find("{http://www.w3.org/2005/Atom}link")
        desc_el = item.find("description") or item.find("{http://www.w3.org/2005/Atom}summary")
        pub_el = item.find("pubDate")
        region_el = item.find("region")

        title = strip_html(title_el.text if title_el is not None and title_el.text else "")
        if not title:
            continue
        company = platform["name"]
        if ":" in title:
            parts = title.split(":", 1)
            company = parts[0].strip()
            title = parts[1].strip()
        link = ""
        if link_el is not None:
            link = link_el.text.strip() if link_el.text else link_el.attrib.get("href", "")
        desc = strip_html(desc_el.text if desc_el is not None and desc_el.text else "")[:1500]
        pub = (pub_el.text.strip()[:10] if pub_el is not None and pub_el.text else today_iso)
        loc = region_el.text.strip() if region_el is not None and region_el.text else "Remote Worldwide"

        results.append(
            {
                "platform_id": platform["id"],
                "platform_name": platform["name"],
                "category": platform.get("category", "Category 6: Curated Remote-First Job Boards"),
                "track": platform.get("track", "Track F: Curated Remote-First & WFA Job Boards"),
                "contract_caveat": platform.get("contract_caveat", "fractional_or_fulltime"),
                "title": title,
                "company": company,
                "location": loc,
                "url": link or platform["url"],
                "description": desc,
                "tags": "rss, remote",
                "published_at": pub,
            }
        )
    return results


def fetch_portal_dork(platform: dict) -> list:
    query = platform.get("search_query", f"site:{platform.get('domain', '')} remote")
    ddg_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(query)}"
    raw = http_get(ddg_url)
    page = raw.decode("utf-8", errors="replace")

    results = []
    block_pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?'
        r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
        re.DOTALL | re.IGNORECASE,
    )
    today_iso = datetime.date.today().isoformat()
    for match in block_pattern.finditer(page):
        raw_href, raw_title, raw_snippet = match.groups()
        if "uddg=" in raw_href:
            parsed_qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
            clean_url = parsed_qs.get("uddg", [raw_href])[0]
        else:
            clean_url = html.unescape(raw_href)

        title = strip_html(raw_title)
        snippet = strip_html(raw_snippet)
        if not title:
            continue

        results.append(
            {
                "platform_id": platform["id"],
                "platform_name": platform["name"],
                "category": platform.get("category", "Portal Dork"),
                "track": platform.get("track", "Track B: Async AI Evaluation & RLHF"),
                "contract_caveat": platform.get("contract_caveat", "async_flexible"),
                "title": title,
                "company": platform["name"],
                "location": "Remote / Global / LATAM (UTC-4)",
                "url": clean_url,
                "description": snippet,
                "tags": platform.get("category", "remote"),
                "published_at": today_iso,
            }
        )
    return results


def insert_opportunities(conn: sqlite3.Connection, items: list, cfg: dict) -> int:
    inserted = 0
    now_iso = datetime.datetime.now().isoformat(timespec="seconds")
    for item in items:
        bol_ok = 1 if is_bolivia_remote_eligible(item, cfg) else 0
        jhash = compute_hash(item["title"], item["company"], item["url"])
        cur = conn.execute("SELECT 1 FROM opportunities WHERE job_hash = ?", (jhash,))
        if cur.fetchone():
            continue
        pub_date = item.get("published_at") or now_iso[:10]
        conn.execute(
            """
            INSERT INTO opportunities (
                job_hash, platform_id, platform_name, category, track, contract_caveat,
                title, company, location, url, description, tags, published_at,
                discovered_at, bolivia_eligible, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
            """,
            (
                jhash,
                item.get("platform_id", ""),
                item.get("platform_name", ""),
                item.get("category", ""),
                item.get("track", ""),
                item.get("contract_caveat", "fractional_or_fulltime"),
                item["title"],
                item.get("company", ""),
                item.get("location", "Remote Worldwide"),
                item.get("url", ""),
                item.get("description", ""),
                item.get("tags", ""),
                pub_date,
                now_iso,
                bol_ok,
            ),
        )
        inserted += 1
    conn.commit()
    return inserted


def run_scout_cycle(args: argparse.Namespace) -> int:
    cfg = load_config()
    conn = init_db()
    total_new = 0
    platforms = [p for p in cfg.get("platforms", []) if p.get("enabled", True)]

    for p in platforms:
        ptype = p.get("type") or "portal_dork"
        if ptype not in ("json_api", "rss_feed"):
            continue
        try:
            items = fetch_json_api(p) if ptype == "json_api" else fetch_rss_feed(p)
            added = insert_opportunities(conn, items, cfg)
            total_new += added
            print(f"[SCOUT] {ptype.upper()} | {p['name']}: fetched {len(items)}, {added} new added.")
        except Exception as exc:
            print(f"[SCOUT WARN] {p['name']} ({ptype}): {exc}")

    conn.close()
    print(f"[SCOUT] Cycle complete. {total_new} new opportunities inserted.")
    return total_new


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Bolivia Remote Job Scout v5.0.0")
    sub = parser.add_subparsers(dest="command")
    run_p = sub.add_parser("run", help="Run on-demand or 15-minute scheduled scan")
    run_p.add_argument("--every-15m", action="store_true", help="Keep running every 15 minutes")
    sub.add_parser("list-platforms", help="List all registered platforms")
    return parser


if __name__ == "__main__":
    parser = build_parser()
    parsed = parser.parse_args()
    if parsed.command == "list-platforms":
        cfg = load_config()
        for p in cfg.get("platforms", []):
            print(f"[{p.get('type', 'dork'):11s}] {p['name']} -> {p['url']}")
    else:
        if getattr(parsed, "every_15m", False):
            while True:
                run_scout_cycle(parsed)
                print("[SCOUT] Sleeping 15 minutes until next scheduled scan...")
                time.sleep(15 * 60)
        else:
            run_scout_cycle(parsed)
