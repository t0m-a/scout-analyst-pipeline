#!/usr/bin/env bash
# install_schedules.sh — Thomas Simon's Career Ops v4.0.0 Automation Installer (La Paz, UTC-4)
# 1. Installs hourly cron job (0 * * * *) running 6-Track SCOUT (clustered) + ANALYST -> /var/www/html/index.html
# 2. Optionally installs systemd --user timer (career-ops.service / career-ops.timer) when called with --systemd

set -euo pipefail
WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$(command -v python3 || command -v python)"

chmod +x "$WORK_DIR/scout_agent.py" "$WORK_DIR/analyst_agent.py"

CRON_JOB_1="0 * * * * cd /opt/scout-analyst && /usr/bin/python3 scout_agent.py run --mode clustered && /usr/bin/python3 analyst_agent.py --run --web-dir /var/www/html && cp -f /opt/scout-analyst/index.html /var/www/html/index.html >> /opt/scout-analyst/pipeline.log 2>&1"

(crontab -l 2>/dev/null | grep -v "scout_agent.py" || true; echo "$CRON_JOB_1") | crontab -
echo "[SUCCESS] Installed hourly cron schedule for SCOUT + ANALYST v4.0.0 -> /var/www/html/index.html (https://pi.tsimon.me)"

if [[ "${1:-}" == "--systemd" ]]; then
  SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
  mkdir -p "$SYSTEMD_USER_DIR"

  cat <<EOF > "$SYSTEMD_USER_DIR/career-ops.service"
[Unit]
Description=Thomas Simon Career Ops v4.0.0 (6-Track SCOUT + ANALYST)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$WORK_DIR
ExecStart=/usr/bin/python3 $WORK_DIR/scout_agent.py run --mode clustered
ExecStart=/usr/bin/python3 $WORK_DIR/analyst_agent.py --run --web-dir /var/www/html
StandardOutput=append:$WORK_DIR/pipeline.log
StandardError=append:$WORK_DIR/pipeline.log
EOF

  cat <<EOF > "$SYSTEMD_USER_DIR/career-ops.timer"
[Unit]
Description=Run Career Ops v4.0.0 Mon-Fri at 08:30 America/La_Paz

[Timer]
OnCalendar=Mon..Fri *-*-* 08:30:00 America/La_Paz
Persistent=true
AccuracySec=1s

[Install]
WantedBy=timers.target
EOF

  systemctl --user daemon-reload
  systemctl --user enable --now career-ops.timer
  echo "[OK] Enabled systemd --user timer career-ops.timer for $WORK_DIR"
fi
