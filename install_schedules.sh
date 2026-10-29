#!/usr/bin/env bash
# Registers recurring hourly cron job for Thomas Simon's SCOUT + ANALYST pipeline (La Paz, UTC-4)
# Generates unified index.html and copies it to /var/www/html/index.html (served via https://pi.tsimon.me)
WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$(command -v python3 || command -v python)"

CRON_JOB_1="0 * * * * cd /opt/scout-analyst && /usr/bin/python3 scout_agent.py run && /usr/bin/python3 analyst_agent.py --run --web-dir /var/www/html && cp -f /opt/scout-analyst/index.html /var/www/html/index.html >> /opt/scout-analyst/pipeline.log 2>&1"

(crontab -l 2>/dev/null | grep -v "scout_agent.py"; echo "$CRON_JOB_1") | crontab -
echo "[SUCCESS] Installed hourly cron schedule for SCOUT + ANALYST -> /var/www/html/index.html (https://pi.tsimon.me)"
