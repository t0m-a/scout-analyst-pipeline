<div align="center">

# 🎯 Scout & Analyst v4.0.0 — Autonomous 6-Track Career Pipeline & Proposal Engine

**Declarative 73-Platform Opportunity Ingestion, 100-Point Burnout-Safe Qualification, Executive Advisory Scorecard & Trilingual (EN/FR/ES) Outreach Suite**

[![Version: v4.0.0 Production](https://img.shields.io/badge/Version-v4.0.0%20Production-8a2be2?style=for-the-badge)](scout_agent.py)
[![Status: Active & Hourly Synced](https://img.shields.io/badge/Status-Active%20%26%20Hourly%20Synced-2ea44f?style=for-the-badge&logo=statuspage&logoColor=white)](https://pi.tsimon.me)
[![Live Portal: pi.tsimon.me](https://img.shields.io/badge/Live%20Portal-pi.tsimon.me-0084b8?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pi.tsimon.me)
[![Architecture: Zero-Dependency Python 3](https://img.shields.io/badge/Python%203-Zero--Dependency%20Stdlib-3776AB?style=for-the-badge&logo=python&logoColor=white)](scout_agent.py)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge&logo=gnu&logoColor=white)](#📄-license)

[![Python 3](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](analyst_agent.py)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](career_ops.db)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](index.html)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](index.html)
[![Markdown](https://img.shields.io/badge/Markdown-000000?style=flat-square&logo=markdown&logoColor=white)](morning_brief.md)
[![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)](https://pi.tsimon.me)
[![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflared-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://pi.tsimon.me)
[![GNU Bash / Cron](https://img.shields.io/badge/Cron%20Automation-4EAA25?style=flat-square&logo=gnubash&logoColor=white)](install_schedules.sh)

---

[**Live Web Portal (`pi.tsimon.me`)**](https://pi.tsimon.me) · [**Unified HTML Dashboard (`index.html`)**](index.html) · [**Morning Briefing (`morning_brief.md`)**](morning_brief.md) · [**Trilingual Proposals (`proposals_ready.md`)**](proposals_ready.md) · [**RAG Knowledge Hub (`rag.tsimon.me`)**](https://rag.tsimon.me) · [**Author Website (`tsimon.me`)**](https://tsimon.me)

</div>

---

## 📌 Project Overview & Purpose (`v4.0.0`)

**Scout & Analyst v4.0.0** (`scout-analyst`) is a **zero-dependency, two-agent Python 3 career operations pipeline** engineered by **Thomas Simon** (La Paz, Bolivia · `UTC-4` · IRS Form W-8BEN Foreign Contractor · CNAM France & ex-Orange Telecom SysAdmin). It completely eliminates manual job-board browsing by automating discovery across **73 active global platforms** spanning **6 Strategic Tracks (Tracks A–F)**, pre-filtering noise, applying a 100-point qualification & negation-aware burnout guardrail, and generating trilingual (**English / French / Spanish**) proposals plus **Track E Executive Advisory Pitches & MSSP Vendor Scorecards**.

It is designed around four core objectives:
1. **Declarative 6-Track Ingestion (`SCOUT v4.0.0`):** Poll JSON APIs, XML/Atom RSS feeds, **Clustered DuckDuckGo Portal Dorks** (chunked 5 domains per query to prevent HTTP 429 rate-limiting across 58+ walled portals), and a **Dead-Platform Circuit Breaker** (automatically blocking `joinstellar.ai` / Stellar AI).
2. **100-Point 6-Track Qualification & Negation-Aware Burnout Guardrail (`ANALYST v4.0.0`):** Score every opportunity against verified skills, certifications, and MSSP metrics in [`master_profile.json`](master_profile.json) while rewarding negated red flags (`zero Tier 1 helpdesk`, `no 24/7 on-call`), applying `-6 pt` full-time agency caveats (`DistantJob`, `WOW Remote Teams`, `BairesDev`), and automatically blocking toxic Tier 1 helpdesk, 24/7 pager, or surveillance roles.
3. **Grounded Trilingual Outreach (`EN / FR / ES`) + Executive Advisory Scorecard:** Generate ready-to-send proposals in English (W-8BEN contractor), French (CNAM France & Orange Telecom pedigree), and Spanish (LATAM/Global + 99% BCDR reliability), plus a **60-Second Executive Advisory Opening Pitch & Instant MSSP Vendor Scorecard** (`Huntress 10/10`, `Acronis 9/10`, `Blackpoint Cyber`, `SentinelOne`, `SaaS Alerts 5/10`, `Augmentt 4/10`) for Track E `$150–$400/hr` consultations.
4. **Hourly Edge Web Publishing (`Nginx` + `Cloudflared`):** Compile [`morning_brief.md`](morning_brief.md), [`proposals_ready.md`](proposals_ready.md), and the 6-Track Radar & Vendor Scorecard into a single interactive [`index.html`](index.html) deployed automatically to `/var/www/html/index.html` (`Y:\var\www\html\index.html`) and served globally via Cloudflare Tunnel at **[pi.tsimon.me](https://pi.tsimon.me)**.

---

## 🚀 Live Distribution & Edge Deployment

> [!IMPORTANT]
> **Live Cloudflared + Nginx Web Portal (`https://pi.tsimon.me`):**
> Every hour (`0 * * * *`), the pipeline polls all enabled sources across Tracks A–F, evaluates new leads, compiles [`morning_brief.md`](morning_brief.md) and [`proposals_ready.md`](proposals_ready.md) into a single unified [`index.html`](index.html), and publishes it to Nginx's `/var/www/html/index.html` (`Y:\var\www\html\index.html`) directory exposed via `cloudflared` tunnel at **[https://pi.tsimon.me](https://pi.tsimon.me)**.

| Component | Path / Endpoint | Status | Description |
| :--- | :--- | :---: | :--- |
| **Public Career Portal** | [`https://pi.tsimon.me`](https://pi.tsimon.me) | ![Live](https://img.shields.io/badge/Live-Cloudflared%20Tunnel-2ea44f?style=flat-square) | Public HTTPS entrypoint routed to local Nginx `/var/www/html/index.html` (`Y:\var\www\html\index.html`) |
| **Unified Web Dashboard** | [`index.html`](index.html) → `/var/www/html/index.html` | ![Synced](https://img.shields.io/badge/Synced-v4.0.0%20Hourly-0084b8?style=flat-square) | Single-page HTML5/CSS3/JS dashboard: Morning Brief, Proposals, 6-Track Radar, MSSP Scorecard & Raw Markdown |
| **Agent 1: SCOUT v4.0.0** | [`scout_agent.py`](scout_agent.py) | ![Active](https://img.shields.io/badge/Agent%201-73%20Platforms-3776AB?style=flat-square) | Clustered multi-track connector (`portal_dork`, `json_api`, `rss_feed`) + Stellar AI circuit breaker |
| **Agent 2: ANALYST v4.0.0** | [`analyst_agent.py`](analyst_agent.py) | ![Active](https://img.shields.io/badge/Agent%202-6--Track%20Qualifier-8a2be2?style=flat-square) | 100-point scoring engine, negation-aware Burnout Guardrail, EN/FR/ES + Advisory pitch generator & Nginx publisher |
| **SQLite State Store** | [`career_ops.db`](career_ops.db) | ![Persistent](https://img.shields.io/badge/SQLite3-Deduplicated-003B57?style=flat-square) | SHA-256 deduplicated opportunity ledger with caveats, scores, verdicts, and EN/FR/ES/Advisory pitches |
| **Markdown Reports** | [`morning_brief.md`](morning_brief.md) · [`proposals_ready.md`](proposals_ready.md) | ![Generated](https://img.shields.io/badge/Markdown-Auto--Generated-000000?style=flat-square) | 3-minute daily executive briefing and copy-pasteable trilingual & advisory outreach pitches |

---

## 🗺️ 6-Track Global Radar Coverage (73 Active Platforms)

| Strategic Track | Category & Scope | Registered Platforms & Sources |
| :--- | :--- | :--- |
| **🤝 Track A** | **Category 4: Direct B2B & Fractional MSP (6)** | `Upwork (Managed Services & Cloud)`, `Intch`, `Contra`, `Wellfound (AngelList Talent)`, `Catalant`, `YunoJuno` |
| **🤖 Track B** | **Category 1: AI Training, RLHF & Technical Logic Evaluation (20)** | `Outlier AI`, `Alignerr`, `DataAnnotation.tech`, `Mindrift`, `Innodata`, `OneForma`, `Mercor`, `OpenTrain AI`, `Surge AI`, `Pareto AI`, `Micro1`, `RWS TrainAI`, `TELUS Digital`, `Peroptyx`, `TransPerfect DataForce`, `Welocalize`, `Appen CrowdGen`, `LXT`, `RemoExperts`, `Awesome AI Jobs` *(Stellar AI / `joinstellar.ai` blocked by circuit breaker)* |
| **🌎 Track C** | **Category 2: Vetted Global & Nearshore LATAM Networks (16)** | `Toptal`, `Turing`, `Revelo`, `Lemon.io`, `Proxify`, `Braintrust`, `Arc.dev`, `Gun.io`, `Tecla`, `Strider`, `NeuronHire (Bolivia)`, `HiresLink`, `Interfell`, `BairesDev`, `Nearsure`, `CloudDevs` |
| **🇫🇷 Track D** | **Category 3: Francophone & European IT/Cloud Marketplaces (9)** | `Freelancermap`, `Free-Work (ex Freelance-Info)`, `LeHibou`, `Freelance-Informatique`, `Malt`, `Comet`, `Crème de la Crème`, `Codeur.com`, `9am.works` |
| **🎙️ Track E** | **Category 5: Executive Expert Networks ($150–$400/hr Calls) (6)** | `GLG (Gerson Lehrman Group)`, `AlphaSights`, `Guidepoint`, `Dialectica`, `Wynter (B2B SaaS Panels)`, `Respondent.io` |
| **📡 Track F** | **Category 6: Curated Remote-First & WFA Job Boards (16)** | `Working Nomads API`, `Himalayas API & RSS`, `Remotive API`, `Jobicy API`, `RemoteOK API`, `We Work Remotely RSS`, `Real Work From Anywhere RSS`, `The Nonlinear Project`, `FlexJobs`, `Remote.co`, `4DayWeek.io`, `DevOpsProjectsHQ`, `FindJobIT (LATAM)`, `DistantJob`, `WOW Remote Teams` |

---

## 🛠️ CLI Usage & Declarative Management (`v4.0.0`)

### 1. Run the Full v4.0.0 Pipeline Manually

```bash
cd /opt/scout-analyst

# Step 1: Poll all enabled platforms (clustered portal dorking by default) and queue new leads
python3 scout_agent.py run --mode clustered

# (Optional) Seed verified 6-track baseline opportunities for offline validation
python3 scout_agent.py run --seed-verified --offline-only

# Step 2: Score leads, generate morning_brief.md, proposals_ready.md, and publish index.html to /var/www/html (or Y:\var\www\html)
python3 analyst_agent.py --run --web-dir /var/www/html

# (Optional) Re-score all existing opportunities in career_ops.db against updated rubric
python3 analyst_agent.py --run --rescore-all --web-dir /var/www/html
```

### 2. Declaratively Manage Platforms & Keywords

```bash
# List all 73+ declared platforms grouped by Track A–F
python3 scout_agent.py list-platforms

# Add a new platform declaratively
python3 scout_agent.py add-platform \
  --name "Cloudflare Remote Jobs Dork" \
  --type portal_dork \
  --url "https://www.cloudflare.com/careers/" \
  --track "Track F: Curated Remote-First & WFA Job Boards" \
  --query 'site:cloudflare.com ("Systems Engineer" OR "Cloud" OR "Remote")'

# Add a must-match or hard-exclude keyword
python3 scout_agent.py add-keyword "proxmox"
python3 scout_agent.py add-keyword "on-site only" --exclude
```

---

## 👤 Author & Contact

**Thomas Simon** — *Senior IT Consultant | Cloud & Systems Engineer (M365 / Azure / Entra ID) | NOC Specialist | AI Context Engineer*
- 🌐 **Professional Portfolio:** [tsimon.me](https://tsimon.me)
- 🎯 **Live Scout & Analyst Portal:** [pi.tsimon.me](https://pi.tsimon.me)
- 🧠 **Edge RAG Knowledge Hub:** [rag.tsimon.me](https://rag.tsimon.me)
- 📧 **Email:** [simon_thomas@outlook.fr](mailto:simon_thomas@outlook.fr)
- 🔗 **LinkedIn:** [tsimonfreelance](https://bo.linkedin.com/in/tsimonfreelance)

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.
