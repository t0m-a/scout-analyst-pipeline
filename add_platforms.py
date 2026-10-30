# 1. Declare a new RSS feed or Job Board API in 1 command:
python scout_agent.py add-platform \
  --name "MSPJobs Board" \
  --type rss_feed \
  --url "https://example-msp-board.com/jobs.rss" \
  --track "Track F: Curated Remote-First & WFA Job Boards"

# 2. Declare a walled career portal (Outlier-style) using automated search dorking:
python scout_agent.py add-platform \
  --name "Scale AI / Remotasks" \
  --type portal_dork \
  --url "https://scale.com/careers" \
  --query 'site:scale.com ("Spanish" OR "French" OR "Linux" OR "Azure" OR "Evaluator")' \
  --track "Track B: Async AI Evaluation & RLHF"

# 3. Add a new high-signal keyword or a new hard-exclude filter globally:
python scout_agent.py add-keyword "scalePad"
python scout_agent.py add-keyword "on-call weekend" --exclude

# 4. List all active platforms or run SCOUT live:
python scout_agent.py list
python scout_agent.py run
