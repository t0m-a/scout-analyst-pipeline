#!/usr/bin/env python3
"""
Agent 2: ANALYST — 100-Point Qualification, Burnout Guardrail & Trilingual Proposal Engine
Author: Thomas Simon Career Automation Suite
Location/Timezone: La Paz, Bolivia (UTC-4)

Reads queued leads from SQLite (career_ops.db), evaluates them against master_profile.json:
- 35% Technical & Domain Fit (M365, Azure, Entra ID, Liongard, IT Glue, Autotask, AI Eval/RLHF)
- 25% Burnout & Autonomy Safety (Rewards async/part-time; auto-SKIPs Tier 1/on-call/surveillance)
- 20% Bolivia / Time-Zone (UTC-4) & Trilingual (EN/FR/ES) Advantage
- 20% Contract & Compensation Fit ($25-$35+/hr, ~20 hrs/wk fractional or async eval)

Outputs:
1. Updates SQLite database with scores, verdicts (APPLY / POSSIBLE / SKIP), and proposals.
2. Generates morning_brief.md and proposals_ready.md locally.
3. Generates a unified single-page index.html combining both reports and copies it to
   Nginx's /var/www/html/index.html (served publicly via Cloudflared tunnel at https://pi.tsimon.me).
"""

import argparse
import datetime
import html
import json
import os
import re
import shutil
import sqlite3
from typing import Dict, Any, List, Tuple, Optional

PROFILE_FILE = "master_profile.json"
DB_FILE = "career_ops.db"
BRIEF_FILE = "morning_brief.md"
PROPOSALS_FILE = "proposals_ready.md"
INDEX_HTML_FILE = "index.html"
PUBLIC_TUNNEL_URL = "https://pi.tsimon.me"
DEFAULT_NGINX_DIR = "/var/www/html"


def resolve_nginx_web_dir(custom_dir: Optional[str] = None) -> Optional[str]:
    candidates = []
    if custom_dir:
        candidates.append(custom_dir)
    if os.environ.get("NGINX_HTML_DIR"):
        candidates.append(os.environ["NGINX_HTML_DIR"])
    candidates.extend([DEFAULT_NGINX_DIR, r"Z:\var\www\html", "/var/ww/html", r"Z:\var\ww\html"])
    for path in candidates:
        if path and os.path.isdir(path):
            return path
    return None


def load_profile(path: str = PROFILE_FILE) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_opportunity(row: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    blob = f"{row['title']} {row['company']} {row['description']} {row['tags']}".lower()
    loc_blob = f"{row['location']} {blob}".lower()
    signals = profile.get("scoring_signals", {})

    matched_skills: List[str] = []
    red_flags_hit: List[str] = []
    notes: List[str] = []

    # 1. Technical & Domain Fit (Max 35 pts)
    raw_tech = 0
    for kw, weight in signals.get("high_value_tech_keywords", {}).items():
        kw_l = kw.lower()
        if re.search(r"\b" + re.escape(kw_l) + r"\b", blob):
            raw_tech += weight
            matched_skills.append(kw)
    tech_score = min(35, int(round((raw_tech / 34.0) * 35)))
    if "warm_lead" in blob:
        tech_score = max(tech_score, 33)

    # 2. Burnout & Autonomy Safety (Max 25 pts)
    raw_safety = 15
    for pos_kw, weight in signals.get("burnout_safety_positive", {}).items():
        if pos_kw.lower() in blob:
            raw_safety += weight // 2
    for neg_kw, penalty in signals.get("burnout_red_flags", {}).items():
        kw_l = neg_kw.lower()
        if kw_l in blob:
            # Ignore if negated (e.g., "zero tier 1 helpdesk", "no on-call", "without pager")
            negated_pattern = r"(?:no|zero|without|never|not)\s+(?:[a-z0-9/-]+\s+){0,3}" + re.escape(kw_l)
            if not re.search(negated_pattern, blob):
                raw_safety += penalty
                red_flags_hit.append(neg_kw)

    for agency, rule in signals.get("agency_specific_rules", {}).items():
        if agency in blob:
            raw_safety += rule.get("modifier", 0)
            notes.append(rule.get("warning", ""))

    safety_score = max(0, min(25, raw_safety))

    # 3. Bolivia / Time-Zone (UTC-4) & Trilingual Advantage (Max 20 pts)
    geo_lang_score = 12
    if any(k in loc_blob for k in ["bolivia", "latam", "latin america", "south america", "utc-4", "americas", "worldwide", "global"]):
        geo_lang_score += 5
    if any(k in blob for k in ["spanish", "french", "bilingual", "trilingual", "andean"]):
        geo_lang_score += 5
        notes.append("Strong multilingual advantage (EN/FR/ES).")
    geo_lang_score = min(20, geo_lang_score)

    # 4. Contract & Rate Structure (Max 20 pts)
    contract_score = 12
    if any(k in blob for k in ["20 hrs", "20 hours", "part-time", "part time", "fractional", "contract", "async", "self-paced", "warm_lead"]):
        contract_score += 8
    elif "full-time" in blob and "contract" not in blob:
        contract_score -= 6
        notes.append("Listed as full-time; verify if fractional 20 hrs/wk is negotiable.")
    contract_score = max(0, min(20, contract_score))

    missing_gaps: List[str] = []
    for gap_candidate in ["terraform", "kubernetes", "aws", "c#", "react", "golang"]:
        if gap_candidate in blob:
            missing_gaps.append(gap_candidate.capitalize())
            tech_score = max(10, tech_score - 8)

    total_score = tech_score + safety_score + geo_lang_score + contract_score

    if red_flags_hit or safety_score < 8:
        verdict = "SKIP"
        notes.insert(0, f"AUTO-SKIP triggered by Burnout Guardrail (Red flags: {', '.join(red_flags_hit)}).")
    elif total_score >= 80:
        verdict = "APPLY"
        notes.insert(0, "High-signal match aligned with tech stack, autonomy, and Bolivia UTC-4 workflow.")
    elif total_score >= 62:
        verdict = "POSSIBLE"
        notes.insert(0, "Viable opportunity; requires positioning around existing M365/Azure/MSP/SysOps strengths.")
    else:
        verdict = "SKIP"
        notes.insert(0, "Low ROI or weak technical alignment.")

    return {
        "total_score": total_score,
        "tech_score": tech_score,
        "safety_score": safety_score,
        "geo_lang_score": geo_lang_score,
        "contract_score": contract_score,
        "verdict": verdict,
        "matched_skills": ", ".join(sorted(set(matched_skills))) if matched_skills else "General Systems / IT",
        "missing_gaps": ", ".join(missing_gaps) if missing_gaps else "None",
        "analyst_notes": " ".join(notes)
    }


def generate_trilingual_proposals(row: Dict[str, Any], eval_res: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[str, str, str]:
    title = row["title"]
    company = row["company"]
    track = row["track"]
    matched = eval_res["matched_skills"]
    is_ai_eval = "Track B" in track or any(k in matched.lower() for k in ["ai ", "rlhf", "evaluator", "trainer"])

    if is_ai_eval:
        pitch_en = (
            f"Subject: Senior Technical AI Evaluator & Trilingual Infrastructure Auditor — {title}\n\n"
            f"Hello {company} Team,\n\n"
            f"I am a trilingual (French/English/Spanish) Senior IT Infrastructure & Cloud Engineer based in La Paz, Bolivia (UTC-4) "
            f"with 13+ years of enterprise systems experience and 6.5 years in NOC/Centralized Services. "
            f"Rather than generic copywriting, my core expertise is systemic root-cause logic: auditing Microsoft Azure/M365 architectures, "
            f"GNU/Linux (Debian since 2005), BCDR runbooks, and PowerShell/Python automation scripts across 40+ to 100+ client environments.\n\n"
            f"Key Alignment for {title}:\n"
            f"• Technical Response & RLHF Auditing: Rigorous step-by-step verification of LLM outputs covering {matched}.\n"
            f"• Operational Track Record: Reduced recurring production incidents by 30% through proactive monitoring standardization and SOP engineering.\n"
            f"• Trilingual Localization: Native French, fluent enterprise English, and Andean Spanish context.\n\n"
            f"Portfolio & Case Studies: https://tsimon.me | simon_thomas@outlook.fr"
        )
        pitch_fr = (
            f"Objet : Évaluateur Logique IA Senior & Consultant Infrastructure Cloud Trilingue — {title}\n\n"
            f"Bonjour l'équipe {company},\n\n"
            f"Ingénieur Systèmes, Cloud (Azure/M365/Entra ID) et Spécialiste NOC trilingue (FR/EN/ES) avec plus de 13 ans d'expérience "
            f"(et utilisateur GNU/Linux Debian depuis 2005), je propose une expertise pointue en audit logique et évaluation RLHF sur les domaines : {matched}.\n\n"
            f"• Réduction de 30 % des incidents récurrents grâce à la standardisation documentaire (IT Glue, SOP) et l'automatisation proactive.\n"
            f"• Vérification rigoureuse des procédures techniques, scripts PowerShell/Python et architectures BCDR.\n"
            f"• Disponibilité asynchrone immédiate (UTC-4).\n\n"
            f"Portfolio : https://tsimon.me | simon_thomas@outlook.fr"
        )
        pitch_es = (
            f"Asunto: Evaluador Técnico de IA y Auditor de Infraestructura Cloud Trilingüe — {title}\n\n"
            f"Hola equipo de {company},\n\n"
            f"Soy Ingeniero Senior de Sistemas y Cloud (Azure/M365/Entra ID) radicado en La Paz, Bolivia (UTC-4), trilingüe (francés, inglés y español) "
            f"con más de 13 años de experiencia en infraestructura empresarial y 6.5 años en operaciones NOC/Servicios Centralizados.\n\n"
            f"• Auditoría Lógica y RLHF: Validación técnica de modelos GenAI, scripts y manuales operativos en {matched}.\n"
            f"• Resultados Verificados: Reducción del 30% en incidentes recurrentes mediante automatización proactiva y estandarización de SOPs.\n"
            f"• Disponibilidad inmediata en modalidad remota asíncrona.\n\n"
            f"Portafolio: https://tsimon.me | simon_thomas@outlook.fr"
        )
    else:
        pitch_en = (
            f"Subject: Senior Cloud & MSP Automation Consultant (M365 / Entra ID / NOC) — {title}\n\n"
            f"Hi {company},\n\n"
            f"With 13+ years in enterprise IT and 6.5 years specializing in MSP Centralized Services and NOC operations, "
            f"I help teams stabilize cloud infrastructure, eliminate alert noise, and standardize documentation. "
            f"Across 40+ to 100+ client environments (1,500–3,500+ endpoints), I reduced recurring incidents by 30% using proactive automation.\n\n"
            f"How I can support {company} (~20 hrs/wk fractional/contract in UTC-4):\n"
            f"• Direct Stack Alignment: {matched} (Microsoft 365, Azure, Entra ID, Liongard, NinjaOne, Kaseya, IT Glue, Autotask, BCDR).\n"
            f"• Proactive Automation & Hygiene: PowerShell, Power Automate, and Python scripting plus audit-ready IT Glue SOPs.\n"
            f"• Discovery Question: Are your current bottlenecks primarily around Entra ID/M365 tenant standardization, RMM alert tuning, or documentation gaps?\n\n"
            f"Best regards,\nThomas Simon | https://tsimon.me | simon_thomas@outlook.fr"
        )
        pitch_fr = (
            f"Objet : Consultant Senior Cloud & Automatisation MSP (M365 / Azure / Entra ID) — {title}\n\n"
            f"Bonjour {company},\n\n"
            f"Fort de 13+ ans d'expérience IT dont 6,5 ans en gestion des services centralisés (CSM/NOC) pour les MSP, "
            f"j'accompagne vos équipes sur {matched}. J'ai géré plus de 40 à 100 environnements clients (1 500 à 3 500+ endpoints) "
            f"et réduit les incidents récurrents de 30 % par l'automatisation (PowerShell, Power Automate, Liongard, NinjaOne, IT Glue, Autotask).\n\n"
            f"Disponible à temps partiel / contrat (~20h/semaine, fuseau UTC-4, trilingue FR/EN/ES).\n"
            f"Portfolio : https://tsimon.me | simon_thomas@outlook.fr"
        )
        pitch_es = (
            f"Asunto: Consultor Senior Cloud y Automatización MSP (M365 / Azure / Entra ID) — {title}\n\n"
            f"Hola {company},\n\n"
            f"Con más de 13 años de experiencia en TI y 6.5 años liderando Servicios Centralizados y NOC para MSPs, "
            f"apoyo en la optimización y automatización de {matched}. He administrado entre 40+ y 100+ entornos de clientes "
            f"logrando una reducción del 30% en incidentes recurrentes mediante Liongard, NinjaOne, Kaseya, IT Glue, Autotask y PowerShell.\n\n"
            f"Disponible por contrato / tiempo parcial (~20 hrs/semana desde La Paz, UTC-4, trilingüe EN/FR/ES).\n"
            f"Portafolio: https://tsimon.me | simon_thomas@outlook.fr"
        )

    return pitch_en, pitch_fr, pitch_es


def run_analyst(web_dir: Optional[str] = None) -> None:
    profile = load_profile()
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT * FROM opportunities WHERE verdict IS NULL")
    rows = cur.fetchall()
    print(f"[ANALYST] Evaluating {len(rows)} queued opportunities against {PROFILE_FILE}...")

    for r in rows:
        row_dict = dict(r)
        res = evaluate_opportunity(row_dict, profile)
        p_en, p_fr, p_es = ("", "", "")
        if res["verdict"] in ("APPLY", "POSSIBLE"):
            p_en, p_fr, p_es = generate_trilingual_proposals(row_dict, res, profile)

        cur.execute("""
            UPDATE opportunities
            SET status = 'EVALUATED',
                total_score = ?,
                tech_score = ?,
                safety_score = ?,
                geo_lang_score = ?,
                contract_score = ?,
                verdict = ?,
                analyst_notes = ?,
                matched_skills = ?,
                missing_gaps = ?,
                proposal_en = ?,
                proposal_fr = ?,
                proposal_es = ?
            WHERE job_hash = ?
        """, (
            res["total_score"], res["tech_score"], res["safety_score"],
            res["geo_lang_score"], res["contract_score"], res["verdict"],
            res["analyst_notes"], res["matched_skills"], res["missing_gaps"],
            p_en, p_fr, p_es, row_dict["job_hash"]
        ))

    conn.commit()
    generate_reports(conn, web_dir=web_dir)
    conn.close()


SHARED_WEB_STYLES = """
  :root {
    --bg-page: #fafafa;
    --bg-card: #ffffff;
    --text-main: #2c2e33;
    --text-muted: #5a5d64;
    --accent-blue: #0084b8;
    --accent-cyan: #1badd6;
    --apply-bg: #ecfdf5;
    --apply-border: #10b981;
    --apply-text: #065f46;
    --possible-bg: #fffbeb;
    --possible-border: #f59e0b;
    --possible-text: #92400e;
    --skip-bg: #f3f4f6;
    --skip-border: #9ca3af;
    --skip-text: #4b5563;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    color: var(--text-main);
    background-color: var(--bg-page);
    font-family: "Helvetica Neue", Helvetica, "Open Sans", Arial, sans-serif;
    line-height: 1.55;
  }
  #navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 300px;
    height: 100%;
    border-right: 1px solid rgba(19, 27, 27, 0.25);
    background: #fafafa;
    z-index: 900;
    display: flex;
    flex-direction: column;
  }
  .header-title {
    color: #2c2e33;
    margin: 14px 12px 10px 12px;
    font-size: 1.35em;
    font-weight: 600;
    text-align: center;
  }
  .hamburger-btn { display: none; }
  #navbar ul {
    flex: 1;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  #navbar li {
    border-top: 1px solid rgba(77, 78, 83, 0.2);
  }
  #navbar a {
    display: block;
    padding: 10px 20px;
    color: #3d3e43;
    text-decoration: none;
    font-size: 0.92em;
    transition: background 0.15s ease, color 0.15s ease;
  }
  #navbar a:hover, #navbar a.active-nav {
    background: linear-gradient(-90deg, #70c1d8 0%, #1badd6 100%);
    color: #fff !important;
    font-weight: 600;
  }
  #main-doc {
    margin-left: 300px;
    padding: 28px 36px 60px 36px;
    max-width: 1200px;
  }
  .top-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    color: #ffffff;
    padding: 24px 28px;
    border-radius: 10px;
    margin-bottom: 22px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  }
  .top-banner h1 {
    margin: 0 0 8px 0;
    font-size: 1.65em;
    font-weight: 600;
    color: #ffffff;
  }
  .top-banner p {
    margin: 4px 0;
    color: #cbd5e1;
    font-size: 0.95em;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 22px;
  }
  .kpi-card {
    background: var(--bg-card);
    border-radius: 8px;
    padding: 16px 18px;
    border-left: 5px solid var(--accent-blue);
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .kpi-card.apply { border-left-color: var(--apply-border); }
  .kpi-card.possible { border-left-color: var(--possible-border); }
  .kpi-card.skip { border-left-color: var(--skip-border); }
  .kpi-value {
    font-size: 1.75em;
    font-weight: 700;
    line-height: 1.1;
  }
  .kpi-label {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-card);
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    margin-bottom: 20px;
  }
  .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .btn-tab {
    border: 1px solid #d1d5db;
    background: #f9fafb;
    color: #374151;
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 0.88em;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .btn-tab:hover, .btn-tab.active {
    background: var(--accent-blue);
    color: #ffffff !important;
    border-color: var(--accent-blue);
  }
  .search-box {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    min-width: 240px;
    font-size: 0.9em;
  }
  .opp-card {
    background: var(--bg-card);
    border: 1px solid #e5e7eb;
    border-left: 5px solid var(--accent-blue);
    border-radius: 8px;
    padding: 18px 22px;
    margin-bottom: 16px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.04);
  }
  .opp-card.verdict-APPLY { border-left-color: var(--apply-border); }
  .opp-card.verdict-POSSIBLE { border-left-color: var(--possible-border); }
  .opp-card.verdict-SKIP { border-left-color: var(--skip-border); opacity: 0.85; }
  .opp-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
  }
  .opp-title {
    margin: 0;
    font-size: 1.18em;
    font-weight: 600;
    color: #111827;
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8em;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .badge-APPLY { background: var(--apply-bg); color: var(--apply-text); border: 1px solid var(--apply-border); }
  .badge-POSSIBLE { background: var(--possible-bg); color: var(--possible-text); border: 1px solid var(--possible-border); }
  .badge-SKIP { background: var(--skip-bg); color: var(--skip-text); border: 1px solid var(--skip-border); }
  .meta-line {
    font-size: 0.88em;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .score-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }
  .score-pill {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 3px 9px;
    font-size: 0.82em;
    font-weight: 600;
    color: #334155;
  }
  .skill-tag {
    display: inline-block;
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    margin: 2px 4px 2px 0;
    font-family: monospace;
  }
  .gap-tag {
    display: inline-block;
    background: #fef2f2;
    color: #b91c1c;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    margin: 2px 4px 2px 0;
    font-family: monospace;
  }
  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
  }
  .btn-action {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 5px;
    font-size: 0.86em;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .btn-primary {
    background: linear-gradient(90deg, #0084b8, #1badd6);
    color: #ffffff !important;
  }
  .btn-secondary {
    background: #f8fafc;
    color: #0f172a !important;
    border-color: #cbd5e1;
  }
  .btn-secondary:hover {
    background: #e2e8f0;
  }
  .proposal-box {
    background: #0f172a;
    color: #f8fafc;
    padding: 16px;
    border-radius: 6px;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 0.88em;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    margin: 8px 0 0 0;
    position: relative;
  }
  .lang-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 10px;
  }
  .guardrail-list li {
    margin-bottom: 8px;
  }
  .raw-md-drawer {
    display: none;
    margin-top: 20px;
  }
  .raw-md-drawer.open {
    display: block;
  }
  footer {
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid #d1d5db;
    text-align: center;
    font-size: 0.82em;
    color: var(--text-muted);
  }
  @media only screen and (max-width: 800px) {
    #navbar {
      width: 100%;
      height: auto;
      position: fixed;
      border-right: none;
      border-bottom: 1px solid rgba(77,78,83,0.25);
      background: rgba(250, 250, 250, 0.92);
      backdrop-filter: blur(10px);
    }
    .header-title {
      text-align: left;
      margin: 0;
      padding: 12px 60px 12px 16px;
      font-size: 1.2em;
    }
    .hamburger-btn {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 5px;
      position: absolute;
      top: 8px;
      right: 14px;
      width: 38px;
      height: 38px;
      border: 1px solid rgba(77,78,83,0.25);
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
    }
    .hamburger-line {
      display: block;
      width: 20px;
      height: 2px;
      background: #1f2023;
    }
    #navbar ul { display: none; max-height: 70vh; }
    #navbar.nav-open ul { display: block; }
    #main-doc { margin-left: 0; margin-top: 58px; padding: 16px; }
  }
"""


def build_unified_index_html(
    today_str: str,
    updated_ts: str,
    apply_rows: List[Dict[str, Any]],
    possible_rows: List[Dict[str, Any]],
    skip_rows: List[Dict[str, Any]],
    brief_md: str,
    proposals_md: str,
    public_url: str = PUBLIC_TUNNEL_URL
) -> str:
    def render_skill_pills(skills_str: str, css_class: str = "skill-tag") -> str:
        if not skills_str or skills_str == "None":
            return '<span style="color:#6b7280;font-size:0.85em;">None</span>'
        parts = [s.strip() for s in skills_str.split(",") if s.strip()]
        return "".join(f'<span class="{css_class}">{html.escape(p)}</span>' for p in parts)

    actionable_rows = apply_rows + possible_rows
    brief_cards_html: List[str] = []
    proposal_cards_html: List[str] = []
    nav_apply_links: List[str] = []

    for idx, r in enumerate(apply_rows + possible_rows + skip_rows, 1):
        verdict = r["verdict"] or "SKIP"
        jhash = r["job_hash"]
        title_esc = html.escape(r["title"])
        comp_esc = html.escape(r["company"])
        track_esc = html.escape(r["track"])
        plat_esc = html.escape(r["platform_name"])
        loc_esc = html.escape(r["location"])
        notes_esc = html.escape(r["analyst_notes"] or "")
        url_esc = html.escape(r["url"] or "#")

        proposal_btn = ""
        inline_proposal_drawer = ""
        if verdict in ("APPLY", "POSSIBLE"):
            p_en = html.escape(r["proposal_en"] or "")
            p_fr = html.escape(r["proposal_fr"] or "")
            p_es = html.escape(r["proposal_es"] or "")
            proposal_btn = (
                f'<button type="button" class="btn-action btn-primary" onclick="toggleInlineProposal(\'{jhash}\')">'
                f'✍️ Toggle EN/FR/ES Proposals</button>'
                f'<button type="button" class="btn-action btn-secondary" onclick="jumpToProposal(\'{jhash}\')">'
                f'📄 Open in Proposals View →</button>'
            )
            inline_proposal_drawer = f"""
            <div id="inline-prop-{jhash}" class="raw-md-drawer" style="margin-top:14px;border-top:1px dashed #cbd5e1;padding-top:12px;">
              <div class="lang-tabs">
                <button type="button" class="btn-tab active" onclick="switchLang('inline-{jhash}', 'en', this)">🇬🇧 English</button>
                <button type="button" class="btn-tab" onclick="switchLang('inline-{jhash}', 'fr', this)">🇫🇷 Français</button>
                <button type="button" class="btn-tab" onclick="switchLang('inline-{jhash}', 'es', this)">🇪🇸 Español</button>
                <button type="button" class="btn-tab" onclick="switchLang('inline-{jhash}', 'all', this)">🌐 Show All 3</button>
              </div>
              <div class="lang-pane lang-en-inline-{jhash}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                  <strong>🇬🇧 English Proposal / Outreach</strong>
                  <button type="button" class="btn-action btn-primary" onclick="copyText('inline-en-{jhash}', this)">📋 Copy EN</button>
                </div>
                <pre id="inline-en-{jhash}" class="proposal-box">{p_en}</pre>
              </div>
              <div class="lang-pane lang-fr-inline-{jhash}" style="display:none;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                  <strong>🇫🇷 Proposition en Français</strong>
                  <button type="button" class="btn-action btn-primary" onclick="copyText('inline-fr-{jhash}', this)">📋 Copier FR</button>
                </div>
                <pre id="inline-fr-{jhash}" class="proposal-box">{p_fr}</pre>
              </div>
              <div class="lang-pane lang-es-inline-{jhash}" style="display:none;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                  <strong>🇪🇸 Propuesta en Español</strong>
                  <button type="button" class="btn-action btn-primary" onclick="copyText('inline-es-{jhash}', this)">📋 Copiar ES</button>
                </div>
                <pre id="inline-es-{jhash}" class="proposal-box">{p_es}</pre>
              </div>
            </div>
            """

        brief_cards_html.append(f"""
        <article class="opp-card brief-card verdict-{verdict}" data-verdict="{verdict}" id="brief-{jhash}">
          <div class="opp-header">
            <h3 class="opp-title">#{idx}. [{r['total_score']}/100] {title_esc} — <span style="font-weight:400;color:#4b5563;">{comp_esc}</span></h3>
            <span class="badge badge-{verdict}">{verdict} · {r['total_score']}/100</span>
          </div>
          <div class="meta-line">
            <strong>Track:</strong> {track_esc} &nbsp;|&nbsp;
            <strong>Platform:</strong> {plat_esc} &nbsp;|&nbsp;
            <strong>Location:</strong> {loc_esc}
          </div>
          <div class="score-pills">
            <span class="score-pill">⚙️ Tech: {r['tech_score']}/35</span>
            <span class="score-pill">🛡️ Burnout Safety: {r['safety_score']}/25</span>
            <span class="score-pill">🌎 Bolivia / Trilingual: {r['geo_lang_score']}/20</span>
            <span class="score-pill">⏱️ Contract Fit: {r['contract_score']}/20</span>
          </div>
          <div style="margin-bottom:6px;">
            <strong style="font-size:0.86em;">Matched Strengths:</strong> {render_skill_pills(r['matched_skills'], 'skill-tag')}
            &nbsp;&nbsp;
            <strong style="font-size:0.86em;">Gaps:</strong> {render_skill_pills(r['missing_gaps'], 'gap-tag')}
          </div>
          <div style="font-size:0.92em;color:#374151;margin-top:6px;">
            <strong>Analyst Verdict:</strong> {notes_esc}
          </div>
          <div class="card-actions">
            {proposal_btn}
            <a class="btn-action btn-secondary" href="{url_esc}" target="_blank" rel="noopener">🔗 Open Source Role / Link</a>
          </div>
          {inline_proposal_drawer}
        </article>
        """)

    for idx, r in enumerate(actionable_rows, 1):
        verdict = r["verdict"] or "POSSIBLE"
        jhash = r["job_hash"]
        title_esc = html.escape(r["title"])
        comp_esc = html.escape(r["company"])
        url_esc = html.escape(r["url"] or "#")
        p_en = html.escape(r["proposal_en"] or "")
        p_fr = html.escape(r["proposal_fr"] or "")
        p_es = html.escape(r["proposal_es"] or "")

        icon = "🔥" if verdict == "APPLY" else "🟡"
        if idx <= 15:
            nav_apply_links.append(
                f'<li><a href="#brief-{jhash}" onclick="switchMainView(\'brief\')">{icon} [{r["total_score"]}] {comp_esc[:22]}</a></li>'
            )

        proposal_cards_html.append(f"""
        <article class="opp-card prop-card verdict-{verdict}" data-verdict="{verdict}" id="job-{jhash}">
          <div class="opp-header">
            <h3 class="opp-title">#{idx}. [{verdict} — {r['total_score']}/100] {title_esc} ({comp_esc})</h3>
            <span class="badge badge-{verdict}">{verdict} · {r['total_score']}/100</span>
          </div>
          <div class="meta-line">
            <strong>Direct URL:</strong> <a href="{url_esc}" target="_blank" rel="noopener">{url_esc}</a>
            &nbsp;|&nbsp;
            <a href="#brief-{jhash}" onclick="switchMainView('brief')">🔍 View Score Breakdown in Morning Brief</a>
          </div>

          <div class="lang-tabs">
            <button type="button" class="btn-tab active" onclick="switchLang('{jhash}', 'en', this)">🇬🇧 English</button>
            <button type="button" class="btn-tab" onclick="switchLang('{jhash}', 'fr', this)">🇫🇷 Français</button>
            <button type="button" class="btn-tab" onclick="switchLang('{jhash}', 'es', this)">🇪🇸 Español</button>
            <button type="button" class="btn-tab" onclick="switchLang('{jhash}', 'all', this)">🌐 Show All 3</button>
          </div>

          <div class="lang-pane lang-en-{jhash}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
              <strong>🇬🇧 English Proposal / Outreach</strong>
              <button type="button" class="btn-action btn-primary" onclick="copyText('prop-en-{jhash}', this)">📋 Copy English Pitch</button>
            </div>
            <pre id="prop-en-{jhash}" class="proposal-box">{p_en}</pre>
          </div>

          <div class="lang-pane lang-fr-{jhash}" style="display:none;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
              <strong>🇫🇷 Proposition en Français</strong>
              <button type="button" class="btn-action btn-primary" onclick="copyText('prop-fr-{jhash}', this)">📋 Copier la proposition FR</button>
            </div>
            <pre id="prop-fr-{jhash}" class="proposal-box">{p_fr}</pre>
          </div>

          <div class="lang-pane lang-es-{jhash}" style="display:none;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
              <strong>🇪🇸 Propuesta en Español</strong>
              <button type="button" class="btn-action btn-primary" onclick="copyText('prop-es-{jhash}', this)">📋 Copiar propuesta ES</button>
            </div>
            <pre id="prop-es-{jhash}" class="proposal-box">{p_es}</pre>
          </div>
        </article>
        """)

    total_count = len(apply_rows) + len(possible_rows) + len(skip_rows)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scout &amp; Analyst Career Pipeline — {today_str} | Thomas Simon</title>
  <link rel="canonical" href="{public_url}/">
  <style>{SHARED_WEB_STYLES}</style>
</head>
<body>
  <nav id="navbar">
    <header class="header-title">Scout &amp; Analyst</header>
    <button type="button" class="hamburger-btn" aria-label="Toggle navigation" onclick="this.parentElement.classList.toggle('nav-open');">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    <ul onclick="if(event.target.tagName==='A'){{this.parentElement.classList.remove('nav-open');}}">
      <li><a href="#morning-brief" id="nav-brief" class="active-nav" onclick="switchMainView('brief')">☕ Morning Brief ({total_count})</a></li>
      <li><a href="#proposals-ready" id="nav-proposals" onclick="switchMainView('proposals')">✍️ Proposals Ready ({len(actionable_rows)})</a></li>
      <li><a href="#raw-markdown" id="nav-markdown" onclick="switchMainView('markdown')">📄 Raw Markdown (.md)</a></li>
      <li><a href="#guardrails" onclick="switchMainView('brief')">🎯 Daily Execution Guardrails</a></li>
      <li><a href="{public_url}" target="_blank" rel="noopener">🌐 {public_url}</a></li>
      <li><a href="https://tsimon.me" target="_blank" rel="noopener">💼 Portfolio (tsimon.me)</a></li>
      {"".join(nav_apply_links)}
    </ul>
  </nav>

  <main id="main-doc">
    <section class="top-banner">
      <h1>☕ Thomas Simon — Scout &amp; Analyst Career Portal ({today_str})</h1>
      <p>
        <strong>Live Tunnel:</strong> <a href="{public_url}" style="color:#38bdf8;text-decoration:none;">{public_url}</a> (Cloudflared + Nginx <code>/var/www/html/index.html</code>)
        &nbsp;|&nbsp; <strong>Last Synced:</strong> {updated_ts} (La Paz · UTC-4)
      </p>
      <p>Unified Single-Page Dashboard: <strong>morning_brief.md</strong> + <strong>proposals_ready.md</strong> (100-Point Qualification &amp; Trilingual Pitches)</p>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card apply" onclick="switchMainView('brief'); filterCards('APPLY');">
        <div class="kpi-value" style="color:#059669;">🔥 {len(apply_rows)}</div>
        <div class="kpi-label"><strong>APPLY</strong> (Score ≥ 80/100)</div>
      </div>
      <div class="kpi-card possible" onclick="switchMainView('brief'); filterCards('POSSIBLE');">
        <div class="kpi-value" style="color:#d97706;">🟡 {len(possible_rows)}</div>
        <div class="kpi-label"><strong>POSSIBLE</strong> (Score 62–79/100)</div>
      </div>
      <div class="kpi-card skip" onclick="switchMainView('brief'); filterCards('SKIP');">
        <div class="kpi-value" style="color:#4b5563;">🛡️ {len(skip_rows)}</div>
        <div class="kpi-label"><strong>AUTO-SKIPPED</strong> (Burnout / Low-ROI)</div>
      </div>
      <div class="kpi-card" onclick="switchMainView('proposals'); filterCards('ALL');">
        <div class="kpi-value" style="color:#0084b8;">✍️ {len(actionable_rows)}</div>
        <div class="kpi-label"><strong>Trilingual Proposals</strong> (EN / FR / ES)</div>
      </div>
    </section>

    <section class="toolbar">
      <div class="filter-group">
        <button type="button" class="btn-tab active" id="tab-view-brief" onclick="switchMainView('brief')">☕ Morning Brief ({total_count})</button>
        <button type="button" class="btn-tab" id="tab-view-proposals" onclick="switchMainView('proposals')">✍️ Proposals Ready ({len(actionable_rows)})</button>
        <button type="button" class="btn-tab" id="tab-view-markdown" onclick="switchMainView('markdown')">📄 Raw Markdown Files</button>
      </div>
      <div class="filter-group" id="verdictFilterBar">
        <button type="button" class="btn-tab active" data-filter="ALL" onclick="filterCards('ALL')">All</button>
        <button type="button" class="btn-tab" data-filter="APPLY" onclick="filterCards('APPLY')">🔥 APPLY ({len(apply_rows)})</button>
        <button type="button" class="btn-tab" data-filter="POSSIBLE" onclick="filterCards('POSSIBLE')">🟡 POSSIBLE ({len(possible_rows)})</button>
        <button type="button" class="btn-tab" data-filter="SKIP" onclick="filterCards('SKIP')">🛡️ SKIP ({len(skip_rows)})</button>
      </div>
      <input type="search" id="searchInput" class="search-box" placeholder="Filter by skill, company, track..." oninput="applyFilters()">
    </section>

    <!-- VIEW 1: MORNING BRIEF -->
    <section id="view-brief">
      <div id="briefCardsContainer">
        {"".join(brief_cards_html)}
      </div>

      <section id="guardrails" class="opp-card" style="border-left-color:#0084b8;margin-top:28px;">
        <h2 style="margin-top:0;">🎯 Today's Execution Guardrails</h2>
        <ol class="guardrail-list">
          <li><strong>08:45 – 09:00:</strong> Copy pre-generated pitch from the <strong>✍️ Proposals Ready</strong> tab for your #1 match above and send.</li>
          <li><strong>09:00 – 11:00:</strong> Python Phase 1 Module (Core/OOP/APIs/File I/O — zero job-board browsing).</li>
          <li><strong>11:00 – 11:30:</strong> Mandatory 30-min cognitive recovery break.</li>
          <li><strong>11:30 – 13:30:</strong> Azure AZ-104 / M365 / Entra ID administration block.</li>
          <li><strong>16:00 – 16:30:</strong> 20-question review quiz + 5-minute preview of tomorrow's module + hard stop at 16:30.</li>
        </ol>
      </section>
    </section>

    <!-- VIEW 2: PROPOSALS READY -->
    <section id="view-proposals" style="display:none;">
      <div id="propCardsContainer">
        {"".join(proposal_cards_html)}
      </div>
    </section>

    <!-- VIEW 3: RAW MARKDOWN -->
    <section id="view-markdown" style="display:none;">
      <div class="opp-card">
        <div class="opp-header">
          <h3 class="opp-title">📄 morning_brief.md</h3>
          <button type="button" class="btn-action btn-primary" onclick="copyText('rawBriefMdContent', this)">📋 Copy morning_brief.md</button>
        </div>
        <pre id="rawBriefMdContent" class="proposal-box">{html.escape(brief_md)}</pre>
      </div>
      <div class="opp-card">
        <div class="opp-header">
          <h3 class="opp-title">📄 proposals_ready.md</h3>
          <button type="button" class="btn-action btn-primary" onclick="copyText('rawPropMdContent', this)">📋 Copy proposals_ready.md</button>
        </div>
        <pre id="rawPropMdContent" class="proposal-box">{html.escape(proposals_md)}</pre>
      </div>
    </section>

    <footer>
      Thomas Simon Career Automation Suite (La Paz, Bolivia · UTC-4) &mdash;
      Served via Nginx (<code>/var/www/html/index.html</code>) &amp; Cloudflared Tunnel at
      <a href="{public_url}">{public_url}</a>
    </footer>
  </main>

  <script>
    let currentVerdict = 'ALL';

    function switchMainView(viewName) {{
      document.getElementById('view-brief').style.display = (viewName === 'brief') ? '' : 'none';
      document.getElementById('view-proposals').style.display = (viewName === 'proposals') ? '' : 'none';
      document.getElementById('view-markdown').style.display = (viewName === 'markdown') ? '' : 'none';

      document.getElementById('tab-view-brief').classList.toggle('active', viewName === 'brief');
      document.getElementById('tab-view-proposals').classList.toggle('active', viewName === 'proposals');
      document.getElementById('tab-view-markdown').classList.toggle('active', viewName === 'markdown');

      document.getElementById('nav-brief').classList.toggle('active-nav', viewName === 'brief');
      document.getElementById('nav-proposals').classList.toggle('active-nav', viewName === 'proposals');
      document.getElementById('nav-markdown').classList.toggle('active-nav', viewName === 'markdown');
    }}

    function toggleInlineProposal(jhash) {{
      const el = document.getElementById('inline-prop-' + jhash);
      if (el) el.classList.toggle('open');
    }}

    function jumpToProposal(jhash) {{
      switchMainView('proposals');
      const target = document.getElementById('job-' + jhash);
      if (target) {{
        target.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
      }}
    }}

    function switchLang(prefixHash, lang, btn) {{
      const container = btn.closest('.opp-card') || btn.parentElement.parentElement;
      btn.parentElement.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ['en', 'fr', 'es'].forEach(l => {{
        const pane = container.querySelector('.lang-' + l + '-' + prefixHash);
        if (pane) {{
          pane.style.display = (lang === 'all' || lang === l) ? 'block' : 'none';
        }}
      }});
    }}

    function filterCards(verdict) {{
      currentVerdict = verdict;
      document.querySelectorAll('#verdictFilterBar .btn-tab[data-filter]').forEach(btn => {{
        btn.classList.toggle('active', btn.getAttribute('data-filter') === verdict);
      }});
      applyFilters();
    }}

    function applyFilters() {{
      const q = (document.getElementById('searchInput').value || '').toLowerCase();
      document.querySelectorAll('.brief-card, .prop-card').forEach(card => {{
        const v = card.getAttribute('data-verdict');
        const matchesVerdict = (currentVerdict === 'ALL') || (v === currentVerdict);
        const matchesQuery = !q || card.innerText.toLowerCase().includes(q);
        card.style.display = (matchesVerdict && matchesQuery) ? '' : 'none';
      }});
    }}

    function copyText(elementId, btn) {{
      const text = document.getElementById(elementId).innerText;
      navigator.clipboard.writeText(text).then(() => {{
        const orig = btn.innerText;
        btn.innerText = '✅ Copied!';
        setTimeout(() => {{ btn.innerText = orig; }}, 1800);
      }});
    }}
  </script>
</body>
</html>"""


def generate_reports(conn: sqlite3.Connection, web_dir: Optional[str] = None) -> None:
    cur = conn.cursor()
    today_str = datetime.date.today().isoformat()
    updated_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    cur.execute("SELECT * FROM opportunities ORDER BY total_score DESC")
    all_rows = [dict(r) for r in cur.fetchall()]

    apply_rows = [r for r in all_rows if r["verdict"] == "APPLY"]
    possible_rows = [r for r in all_rows if r["verdict"] == "POSSIBLE"]
    skip_rows = [r for r in all_rows if r["verdict"] == "SKIP"]

    brief_lines = [
        f"# ☕ Thomas's Morning Professional Briefing — {today_str}",
        f"**Schedule Window:** 08:45 – 09:00 AM (La Paz, UTC-4) | **Reading Time:** ~3 Minutes | **Web Portal:** {PUBLIC_TUNNEL_URL}",
        f"**Pipeline Summary:** 🔥 **{len(apply_rows)} APPLY** (≥80/100) | 🟡 **{len(possible_rows)} POSSIBLE** (62–79/100) | 🛡️ **{len(skip_rows)} AUTO-SKIPPED** (Burnout/Low-ROI Filter)",
        "",
        "---",
        "## 🔥 Top High-Signal Opportunities (Action Required: Pick 1–2 Max Today)"
    ]

    for idx, r in enumerate(apply_rows, 1):
        brief_lines.extend([
            f"### {idx}. [{r['total_score']}/100] {r['title']} — *{r['company']}*",
            f"- **Track:** {r['track']} | **Platform:** {r['platform_name']} | **Location:** {r['location']}",
            f"- **Score Breakdown:** Tech `{r['tech_score']}/35` · Burnout Safety `{r['safety_score']}/25` · Bolivia/Trilingual `{r['geo_lang_score']}/20` · Contract `{r['contract_score']}/20`",
            f"- **Matched Strengths:** `{r['matched_skills']}` | **Gaps to Position Around:** `{r['missing_gaps']}`",
            f"- **Analyst Verdict:** **{r['verdict']}** — {r['analyst_notes']}",
            f"- **Direct Link:** {r['url']}",
            ""
        ])

    if possible_rows:
        brief_lines.extend([
            "---",
            "## 🟡 Secondary Matches (POSSIBLE — Position Around Existing Strengths)"
        ])
        for r in possible_rows:
            brief_lines.append(
                f"- **[{r['total_score']}/100] {r['title']}** ({r['company']}) — Matched: `{r['matched_skills']}` | Gaps: `{r['missing_gaps']}` | *{r['analyst_notes']}* ([Link]({r['url']}))"
            )
        brief_lines.append("")

    if skip_rows:
        brief_lines.extend([
            "---",
            "## 🛡️ Blocked by Burnout & ROI Guardrail (Zero Action Needed)"
        ])
        for r in skip_rows:
            brief_lines.append(f"- ~~{r['title']} ({r['company']})~~ — **Score: {r['total_score']}/100 [SKIP]** → *{r['analyst_notes']}*")
        brief_lines.append("")

    brief_lines.extend([
        "---",
        "## 🎯 Today's Execution Guardrails",
        f"1. **08:45 – 09:00:** Open `{PUBLIC_TUNNEL_URL}` (or `proposals_ready.md`), copy pre-generated pitch for your #1 match above, and send.",
        "2. **09:00 – 11:00:** Python Phase 1 Module (Core/OOP/APIs/File I/O — zero job-board browsing).",
        "3. **11:00 – 11:30:** Mandatory 30-min cognitive recovery break.",
        "4. **11:30 – 13:30:** Azure AZ-104 / M365 / Entra ID administration block.",
        "5. **16:00 – 16:30:** 20-question review quiz + 5-minute preview of tomorrow's module + hard stop at 16:30."
    ])

    brief_md_content = "\n".join(brief_lines)
    with open(BRIEF_FILE, "w", encoding="utf-8") as f:
        f.write(brief_md_content)

    prop_lines = [
        f"# ✍️ Tailored Trilingual Proposals (EN / FR / ES) — {today_str}",
        f"*Grounded 100% in `master_profile.json` (Zero invented experience) · Live Portal: {PUBLIC_TUNNEL_URL}*",
        ""
    ]
    for r in apply_rows + possible_rows:
        prop_lines.extend([
            "---",
            f"## [{r['verdict']} — {r['total_score']}/100] {r['title']} ({r['company']})",
            f"**URL:** {r['url']}",
            "",
            "### 🇬🇧 English Proposal / Outreach",
            "```text",
            r["proposal_en"],
            "```",
            "### 🇫🇷 Proposition en Français",
            "```text",
            r["proposal_fr"],
            "```",
            "### 🇪🇸 Propuesta en Español",
            "```text",
            r["proposal_es"],
            "```",
            ""
        ])

    prop_md_content = "\n".join(prop_lines)
    with open(PROPOSALS_FILE, "w", encoding="utf-8") as f:
        f.write(prop_md_content)

    # Generate unified single-page index.html locally
    index_html_content = build_unified_index_html(
        today_str=today_str,
        updated_ts=updated_ts,
        apply_rows=apply_rows,
        possible_rows=possible_rows,
        skip_rows=skip_rows,
        brief_md=brief_md_content,
        proposals_md=prop_md_content,
        public_url=PUBLIC_TUNNEL_URL
    )

    with open(INDEX_HTML_FILE, "w", encoding="utf-8") as f:
        f.write(index_html_content)

    print(
        f"[ANALYST COMPLETE] Wrote {BRIEF_FILE}, {PROPOSALS_FILE}, and unified {INDEX_HTML_FILE} "
        f"({len(apply_rows)} APPLY, {len(possible_rows)} POSSIBLE, {len(skip_rows)} SKIP)."
    )

    # Copy unified index.html to Nginx web root (/var/www/html/index.html) for https://pi.tsimon.me
    target_web_dir = resolve_nginx_web_dir(web_dir)
    if target_web_dir:
        try:
            dest_index = os.path.join(target_web_dir, INDEX_HTML_FILE)
            shutil.copyfile(INDEX_HTML_FILE, dest_index)
            print(f"[NGINX SYNC] Published unified {INDEX_HTML_FILE} to {dest_index} (live at {PUBLIC_TUNNEL_URL})")
        except Exception as exc:
            print(f"[!] Warning: Could not copy {INDEX_HTML_FILE} to {target_web_dir}: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agent 2: ANALYST — Scoring & Proposal Generator")
    parser.add_argument("--run", action="store_true", help="Evaluate all queued opportunities and generate reports")
    parser.add_argument("--web-dir", default=None, help="Optional Nginx web root directory (defaults to /var/www/html)")
    args = parser.parse_args()
    run_analyst(web_dir=args.web_dir)
