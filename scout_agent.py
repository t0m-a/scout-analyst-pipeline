#!/usr/bin/env python3
"""
Agent 1: SCOUT — Declarative Multi-Platform Opportunity Ingestion Engine
Author: Thomas Simon Career Automation Suite
Location/Timezone: La Paz, Bolivia (UTC-4)

Zero-dependency Python 3 script (uses standard library only) that:
1. Reads platforms and search parameters declaratively from platforms_config.json.
2. Lets you declare new platforms, feeds, search dorks, keywords, or warm contacts via CLI
   WITHOUT manually browsing or filtering job boards.
3. Fetches, normalizes, pre-filters, and deduplicates opportunities into SQLite (career_ops.db).
"""

import argparse
import datetime
import hashlib
import html
import json
import os
import re
import sqlite3
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, List, Any

CONFIG_FILE = "platforms_config.json"
DB_FILE = "career_ops.db"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThomasSimonCareerScout/1.0"


def load_config(path: str = CONFIG_FILE) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_config(cfg: Dict[str, Any], path: str = CONFIG_FILE) -> None:
    cfg["last_updated"] = datetime.date.today().isoformat()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def init_db(db_path: str = DB_FILE) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            job_hash TEXT PRIMARY KEY,
            platform_id TEXT,
            platform_name TEXT,
            track TEXT,
            title TEXT,
            company TEXT,
            location TEXT,
            url TEXT,
            description TEXT,
            tags TEXT,
            published_date TEXT,
            discovered_at TEXT,
            status TEXT DEFAULT 'NEW',
            total_score INTEGER DEFAULT NULL,
            tech_score INTEGER DEFAULT NULL,
            safety_score INTEGER DEFAULT NULL,
            geo_lang_score INTEGER DEFAULT NULL,
            contract_score INTEGER DEFAULT NULL,
            verdict TEXT DEFAULT NULL,
            analyst_notes TEXT DEFAULT NULL,
            matched_skills TEXT DEFAULT NULL,
            missing_gaps TEXT DEFAULT NULL,
            proposal_en TEXT DEFAULT NULL,
            proposal_fr TEXT DEFAULT NULL,
            proposal_es TEXT DEFAULT NULL
        )
    """)
    conn.commit()
    return conn


def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    text = html.unescape(str(raw_html))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def compute_hash(title: str, company: str, url: str) -> str:
    norm = f"{title.strip().lower()}|{company.strip().lower()}|{url.strip().lower()}"
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()[:24]


def passes_global_pre_filter(item: Dict[str, str], global_params: Dict[str, Any]) -> bool:
    """
    Fast declarative pre-filter so irrelevant jobs never clutter your database.
    Warm CRM items always pass.
    """
    if item.get("connector_type") == "warm_crm":
        return True

    blob = f"{item.get('title', '')} {item.get('description', '')} {item.get('tags', '')}".lower()
    loc_blob = f"{item.get('location', '')} {blob}".lower()

    # 1. Check hard exclusions
    for bad_kw in global_params.get("hard_exclude_keywords", []):
        if bad_kw.lower() in blob:
            return False

    # 2. Check location blacklist
    for bad_loc in global_params.get("location_blacklist", []):
        if bad_loc.lower() in loc_blob:
            return False

    # 3. Must match at least one target keyword
    must_kws = global_params.get("must_match_any_keyword", [])
    if must_kws and not any(kw.lower() in blob for kw in must_kws):
        return False

    return True


def fetch_url(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_json_api(platform: Dict[str, Any]) -> List[Dict[str, str]]:
    results = []
    raw = fetch_url(platform["url"])
    data = json.loads(raw)

    root_key = platform.get("json_root_key")
    if root_key and isinstance(data, dict):
        items = data.get(root_key, [])
    elif isinstance(data, list):
        items = data[1:] if platform.get("skip_first_element") else data
    else:
        items = []

    fmap = platform.get("field_mapping", {})
    for entry in items:
        if not isinstance(entry, dict):
            continue
        title = str(entry.get(fmap.get("title", "title"), ""))
        company = str(entry.get(fmap.get("company", "company"), "Unknown"))
        desc = clean_html(entry.get(fmap.get("description", "description"), ""))
        url = str(entry.get(fmap.get("url", "url"), platform["url"]))
        loc = str(entry.get(fmap.get("location", "location"), "Remote"))
        tags_raw = entry.get(fmap.get("tags", "tags"), "")
        tags = ", ".join(tags_raw) if isinstance(tags_raw, list) else str(tags_raw)
        pub_date = str(entry.get(fmap.get("date", "date"), datetime.date.today().isoformat()))

        results.append({
            "platform_id": platform["id"],
            "platform_name": platform["name"],
            "connector_type": "json_api",
            "track": platform.get("track", "General"),
            "title": title,
            "company": company,
            "location": loc,
            "url": url,
            "description": desc[:4000],
            "tags": tags,
            "published_date": pub_date
        })
    return results


def fetch_rss_feed(platform: Dict[str, Any]) -> List[Dict[str, str]]:
    results = []
    raw = fetch_url(platform["url"])
    root = ET.fromstring(raw)
    for item in root.findall(".//item"):
        raw_title = item.findtext("title", "")
        if ":" in raw_title:
            company, title = [p.strip() for p in raw_title.split(":", 1)]
        else:
            company, title = platform["name"], raw_title.strip()
        desc = clean_html(item.findtext("description", ""))
        link = item.findtext("link", platform["url"])
        pub_date = item.findtext("pubDate", datetime.date.today().isoformat())
        region = item.findtext("region", "Remote")

        results.append({
            "platform_id": platform["id"],
            "platform_name": platform["name"],
            "connector_type": "rss_feed",
            "track": platform.get("track", "Track C: Curated Remote Boards"),
            "title": title,
            "company": company,
            "location": region,
            "url": link,
            "description": desc[:4000],
            "tags": "rss, remote",
            "published_date": pub_date
        })
    return results


def fetch_portal_dork(platform: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Uses DuckDuckGo Lite HTML query to discover new role pages on walled portals
    (Outlier, Innodata, Alignerr, Mindrift, OneForma, Toptal, etc.) without manual browsing.
    """
    results = []
    query = platform.get("search_query", "")
    if not query:
        return results
    encoded_q = urllib.parse.quote_plus(query)
    ddg_url = f"https://html.duckduckgo.com/html/?q={encoded_q}"
    raw = fetch_url(ddg_url)

    # Parse result links and snippets from DuckDuckGo HTML
    pattern = re.compile(
        r'<a rel="nofollow" class="result__a" href="([^"]+)">(.*?)</a>.*?<a class="result__snippet"[^>]*>(.*?)</a>',
        re.DOTALL
    )
    for match in pattern.finditer(raw):
        href, title_html, snippet_html = match.groups()
        title = clean_html(title_html)
        snippet = clean_html(snippet_html)
        results.append({
            "platform_id": platform["id"],
            "platform_name": platform["name"],
            "connector_type": "portal_dork",
            "track": platform.get("track", "Track B: Async AI Evaluation & RLHF"),
            "title": title,
            "company": platform["name"].split("(")[0].strip(),
            "location": "Remote / Bolivia Eligible",
            "url": href,
            "description": f"{snippet} | Target Positioning: {platform.get('target_positioning', '')}",
            "tags": "portal_dork, ai_evaluation, remote",
            "published_date": datetime.date.today().isoformat()
        })
    return results


def fetch_warm_crm(platform: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Generates scheduled action items for warm contacts (Mercedes, Rayan, Todd, Kevin, Liz, John)
    when their follow-up cadence is due.
    """
    results = []
    today = datetime.date.today()
    for contact in platform.get("contacts", []):
        last_str = contact.get("last_contact", "2026-10-01")
        try:
            last_dt = datetime.date.fromisoformat(last_str)
        except ValueError:
            last_dt = today - datetime.timedelta(days=30)
        days_since = (today - last_dt).days
        cadence = int(contact.get("cadence_days", 14))

        if days_since >= cadence:
            results.append({
                "platform_id": platform["id"],
                "platform_name": platform["name"],
                "connector_type": "warm_crm",
                "track": platform.get("track", "Track A: Warm Network & Direct Outreach"),
                "title": f"Warm Outreach / Follow-Up: {contact['name']} ({contact.get('focus', 'Consulting')})",
                "company": f"Direct Network ({contact['name']})",
                "location": "Remote / Async (UTC-4)",
                "url": f"mailto:simon_thomas@outlook.fr?subject=Follow-up-{contact['name']}",
                "description": (
                    f"Scheduled {cadence}-day touchpoint for {contact['name']} (last contact: {last_str}, "
                    f"{days_since} days ago). Status: {contact.get('status', '')}. "
                    f"Focus area: {contact.get('focus', '')}. Highlight 13+ yrs IT, M365/Azure/Entra ID, "
                    f"Liongard/IT Glue/Autotask, and 30% incident reduction."
                ),
                "tags": "warm_lead, fractional, msp, azure, m365, documentation, async",
                "published_date": today.isoformat()
            })
    return results


def get_demo_seed_items() -> List[Dict[str, str]]:
    """
    Realistic seed opportunities across Track A, Track B, and Track C for offline testing & validation.
    """
    today = datetime.date.today().isoformat()
    return [
        {
            "platform_id": "working_nomads_api",
            "platform_name": "Working Nomads Public API",
            "connector_type": "json_api",
            "track": "Track C: Curated Remote Boards",
            "title": "Fractional M365, Entra ID & MSP Automation Consultant (20 hrs/wk)",
            "company": "Apex Cloud Managed Services",
            "location": "Remote (Americas / UTC-4 / LATAM Friendly)",
            "url": "https://www.workingnomads.com/jobs/fractional-m365-entra-msp-consultant-apex",
            "description": (
                "Seeking a Senior Systems & Cloud Consultant for 20 hours/week ($32-$40/hr) on an ongoing contract. "
                "You will audit Microsoft 365 tenants, enforce Conditional Access in Entra ID, standardize runbooks "
                "in IT Glue, and build proactive monitoring/alerting automations using Liongard, NinjaOne, Autotask, "
                "PowerShell, and Power Automate. Asynchronous workflow with zero Tier 1 helpdesk phone queue."
            ),
            "tags": "microsoft 365, azure, entra id, liongard, it glue, autotask, powershell, part-time, async",
            "published_date": today
        },
        {
            "platform_id": "ai_eval_outlier_bolivia",
            "platform_name": "Outlier AI Portal (Andean Spanish & Tech Writer)",
            "connector_type": "portal_dork",
            "track": "Track B: Async AI Evaluation & RLHF",
            "title": "AI Logic Evaluator & Technical Writer — Cloud/SysAdmin & Andean Spanish Track",
            "company": "Outlier AI",
            "location": "Remote Worldwide / Bolivia Actively Hiring",
            "url": "https://app.outlier.ai/en/expert/jobs/sysadmin-spanish-evaluator",
            "description": (
                "Evaluate and audit complex LLM responses covering Linux (Debian), Microsoft Azure, system administration, "
                "network troubleshooting, and BCDR procedures across English, French, and Andean Spanish. "
                "100% asynchronous self-paced contract ($28-$35/hr equivalent) ideal for experienced IT infrastructure auditors."
            ),
            "tags": "ai evaluator, rlhf, spanish, french, linux, azure, documentation, async, part-time",
            "published_date": today
        },
        {
            "platform_id": "ai_eval_innodata",
            "platform_name": "Innodata Careers (IT/Systems Auditing & Localization)",
            "connector_type": "portal_dork",
            "track": "Track B: Async AI Evaluation & RLHF",
            "title": "AI Trainer & Technical Documentation Auditor (Enterprise IT / Cloud)",
            "company": "Innodata",
            "location": "Remote (Global / Latin America)",
            "url": "https://www.innodata.com/careers/ai-trainer-enterprise-it",
            "description": (
                "Rewrite and validate machine-generated Standard Operating Procedures (SOPs), disaster recovery (BCDR) "
                "manuals, and M365/Azure administration guides. Requires 10+ years of non-coding systems engineering "
                "or IT auditing logic plus bilingual English/Spanish or English/French proficiency. Flexible part-time."
            ),
            "tags": "ai trainer, sop, documentation, m365, azure, bcdr, spanish, french, async, contract",
            "published_date": today
        },
        {
            "platform_id": "warm_network_crm",
            "platform_name": "Warm Leads & Direct Network Pipeline",
            "connector_type": "warm_crm",
            "track": "Track A: Warm Network & Direct Outreach",
            "title": "Warm Outreach / Follow-Up: Todd & Mercedes (MSP Centralized Services & Cloud Automation)",
            "company": "Direct Network (Todd / Mercedes)",
            "location": "Remote / Async (UTC-4)",
            "url": "mailto:simon_thomas@outlook.fr?subject=Warm-Outreach-Todd-Mercedes",
            "description": (
                "Scheduled 14-day warm outreach to Todd and Mercedes sharing updated tsimon.me portfolio and "
                "availability for fractional Centralized Services Management (80 hrs/mo), IT Glue/Autotask documentation "
                "audits, Liongard/NinjaOne alert remediation (30% recurring incident reduction), and M365/Entra ID hardening."
            ),
            "tags": "warm_lead, fractional, msp, liongard, it glue, autotask, m365, entra, 20 hours",
            "published_date": today
        },
        {
            "platform_id": "remotive_api",
            "platform_name": "Remotive Remote Jobs API",
            "connector_type": "json_api",
            "track": "Track C: Curated Remote Boards",
            "title": "Cloud Infrastructure & DevOps Engineer (Azure / Python / Docker)",
            "company": "Credible Data Infrastructure",
            "location": "Remote (Americas / UTC-4)",
            "url": "https://remotive.com/remote-jobs/devops/cloud-infrastructure-engineer-credible",
            "description": (
                "Looking for a Senior SysOps/Cloud Engineer transitioning into DevOps & Data Infrastructure. "
                "Strong Linux Debian, Azure CLI, Docker, and PowerShell/Python scripting required; Terraform and Kubernetes "
                "are a plus. Contract-to-hire or flexible contractor structure."
            ),
            "tags": "azure, linux, debian, python, powershell, docker, devops, contract",
            "published_date": today
        },
        {
            "platform_id": "remoteok_api",
            "platform_name": "RemoteOK JSON Feed",
            "connector_type": "json_api",
            "track": "Track C: Curated Remote Boards",
            "title": "Tier 1 MSP Helpdesk Support Technician (24/7 On-Call Rotation)",
            "company": "FastFix IT Support",
            "location": "Remote",
            "url": "https://remoteok.com/remote-jobs/tier-1-helpdesk-fastfix",
            "description": (
                "High-volume inbound phone support and Tier 1 ticket triage. Requires 24/7 on-call pager rotation "
                "and desktop time-tracker screenshots every 5 minutes. Full-time W2 only."
            ),
            "tags": "helpdesk, on-call, 24/7, phone support, tier 1",
            "published_date": today
        }
    ]


def ingest_items(conn: sqlite3.Connection, items: List[Dict[str, str]], global_params: Dict[str, Any], bypass_prefilter_for_demo: bool = False) -> Dict[str, int]:
    cur = conn.cursor()
    stats = {"fetched": len(items), "filtered_out": 0, "duplicates": 0, "inserted": 0}
    now_iso = datetime.datetime.now().isoformat(timespec="seconds")

    for item in items:
        if not bypass_prefilter_for_demo and not passes_global_pre_filter(item, global_params):
            stats["filtered_out"] += 1
            continue

        jhash = compute_hash(item["title"], item["company"], item["url"])
        cur.execute("SELECT 1 FROM opportunities WHERE job_hash = ?", (jhash,))
        if cur.fetchone():
            stats["duplicates"] += 1
            continue

        cur.execute("""
            INSERT INTO opportunities (
                job_hash, platform_id, platform_name, track, title, company,
                location, url, description, tags, published_date, discovered_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
        """, (
            jhash, item["platform_id"], item["platform_name"], item["track"],
            item["title"], item["company"], item["location"], item["url"],
            item["description"], item["tags"], item["published_date"], now_iso
        ))
        stats["inserted"] += 1

    conn.commit()
    return stats


def run_scout(demo_mode: bool = False) -> None:
    cfg = load_config()
    conn = init_db()
    global_params = cfg.get("global_parameters", {})
    all_items: List[Dict[str, str]] = []

    if demo_mode:
        print("[SCOUT] Running in DEMO/VALIDATION mode (plus Warm CRM check)...")
        all_items.extend(get_demo_seed_items())
    else:
        for plat in cfg.get("platforms", []):
            if not plat.get("enabled", True):
                continue
            ctype = plat.get("connector_type")
            pname = plat.get("name")
            try:
                print(f"[SCOUT] Polling {pname} ({ctype})...")
                if ctype == "json_api":
                    all_items.extend(fetch_json_api(plat))
                elif ctype == "rss_feed":
                    all_items.extend(fetch_rss_feed(plat))
                elif ctype == "portal_dork":
                    all_items.extend(fetch_portal_dork(plat))
                elif ctype == "warm_crm":
                    all_items.extend(fetch_warm_crm(plat))
            except Exception as exc:
                print(f"  [!] Warning polling {pname}: {exc}")

    # In demo mode we allow the toxic helpdesk example into the DB so ANALYST can demonstrate auto-SKIP
    stats = ingest_items(conn, all_items, global_params, bypass_prefilter_for_demo=demo_mode)
    print(
        f"[SCOUT COMPLETE] Fetched: {stats['fetched']} | Pre-filtered noise: {stats['filtered_out']} | "
        f"Duplicates skipped: {stats['duplicates']} | New leads queued for ANALYST: {stats['inserted']}"
    )
    conn.close()


def cli_add_platform(args: argparse.Namespace) -> None:
    cfg = load_config()
    pid = re.sub(r"[^a-z0-9_]+", "_", args.name.lower()).strip("_")
    new_plat: Dict[str, Any] = {
        "id": pid,
        "name": args.name,
        "enabled": True,
        "connector_type": args.type,
        "track": args.track,
        "url": args.url
    }
    if args.type == "portal_dork":
        new_plat["search_query"] = args.query or f'site:{urllib.parse.urlparse(args.url).netloc} ("Azure" OR "M365" OR "MSP" OR "AI Trainer")'
        new_plat["target_positioning"] = args.positioning or "Senior Cloud & AI Infrastructure Consultant"

    cfg.setdefault("platforms", []).append(new_plat)
    save_config(cfg)
    print(f"[SCOUT CONFIG] Added new platform '{args.name}' ({args.type}) to {CONFIG_FILE}.")


def cli_add_keyword(args: argparse.Namespace) -> None:
    cfg = load_config()
    gparams = cfg.setdefault("global_parameters", {})
    target_list = "hard_exclude_keywords" if args.exclude else "must_match_any_keyword"
    kw = args.keyword.strip().lower()
    if kw not in gparams.setdefault(target_list, []):
        gparams[target_list].append(kw)
        save_config(cfg)
        print(f"[SCOUT CONFIG] Added '{kw}' to {target_list} in {CONFIG_FILE}.")
    else:
        print(f"[SCOUT CONFIG] '{kw}' is already in {target_list}.")


def cli_add_contact(args: argparse.Namespace) -> None:
    cfg = load_config()
    for plat in cfg.get("platforms", []):
        if plat.get("connector_type") == "warm_crm":
            plat.setdefault("contacts", []).append({
                "name": args.name,
                "status": args.status or "Ready for initial outreach",
                "cadence_days": args.cadence,
                "last_contact": "2026-10-01",
                "focus": args.focus or "MSP / Cloud / Automation"
            })
            save_config(cfg)
            print(f"[SCOUT CONFIG] Added warm contact '{args.name}' (cadence: {args.cadence}d) to Warm CRM.")
            return


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent 1: SCOUT — Declarative Opportunity Ingestion")
    sub = parser.add_subparsers(dest="cmd")

    p_run = sub.add_parser("run", help="Poll all enabled platforms and queue new leads")
    p_run.add_argument("--demo", action="store_true", help="Seed realistic Track A/B/C leads for offline testing")

    p_add_plat = sub.add_parser("add-platform", help="Declaratively register a new platform without editing code")
    p_add_plat.add_argument("--name", required=True, help="Display name of the platform")
    p_add_plat.add_argument("--type", required=True, choices=["json_api", "rss_feed", "portal_dork", "html_board"], help="Connector type")
    p_add_plat.add_argument("--url", required=True, help="API, RSS, or portal URL")
    p_add_plat.add_argument("--track", default="Track C: Curated Remote Boards", help="Pipeline track label")
    p_add_plat.add_argument("--query", default=None, help="Search query for portal_dork type")
    p_add_plat.add_argument("--positioning", default=None, help="Target positioning note")

    p_add_kw = sub.add_parser("add-keyword", help="Add a must-match or exclude keyword to global parameters")
    p_add_kw.add_argument("keyword", help="Keyword or phrase")
    p_add_kw.add_argument("--exclude", action="store_true", help="Add to hard_exclude_keywords instead of must_match")

    p_add_crm = sub.add_parser("add-contact", help="Add a person to the Warm Network CRM tracker")
    p_add_crm.add_argument("--name", required=True, help="Contact name")
    p_add_crm.add_argument("--focus", default="M365 / Azure / MSP Consulting", help="Focus topic")
    p_add_crm.add_argument("--status", default="Ready for outreach", help="Current status")
    p_add_crm.add_argument("--cadence", type=int, default=14, help="Follow-up cadence in days")

    p_list = sub.add_parser("list", help="List all declared platforms and global parameters")

    args = parser.parse_args()
    if args.cmd == "run":
        run_scout(demo_mode=args.demo)
    elif args.cmd == "add-platform":
        cli_add_platform(args)
    elif args.cmd == "add-keyword":
        cli_add_keyword(args)
    elif args.cmd == "add-contact":
        cli_add_contact(args)
    elif args.cmd == "list":
        cfg = load_config()
        print(f"=== Declared Platforms ({len(cfg.get('platforms', []))}) ===")
        for p in cfg.get("platforms", []):
            status = "ENABLED" if p.get("enabled") else "DISABLED"
            print(f" - [{status}] {p['id']} ({p['connector_type']}) -> {p['name']} [{p.get('track')}]")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
