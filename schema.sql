-- Cloudflare D1 / SQLite Schema for Bolivia Remote Job Scout & Evaluator (v5.5.0)
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
  compensation_usd TEXT DEFAULT '',
  ai_summary_es TEXT DEFAULT '',
  ai_summary_en TEXT DEFAULT '',
  ai_verified INTEGER DEFAULT 0,
  embedding_id TEXT DEFAULT '',
  status TEXT DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_opportunities_eligible_date
  ON opportunities(bolivia_eligible, discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_platform
  ON opportunities(platform_id);

CREATE TABLE IF NOT EXISTS custom_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  track TEXT,
  type TEXT DEFAULT 'auto',
  enabled INTEGER DEFAULT 1,
  domain TEXT,
  url TEXT NOT NULL,
  rss_url TEXT DEFAULT '',
  search_query TEXT,
  contract_caveat TEXT DEFAULT 'fractional_or_fulltime',
  bolivia_avenue TEXT DEFAULT '',
  notes TEXT,
  created_at TEXT,
  added_at TEXT
);

CREATE TABLE IF NOT EXISTS evaluations (
  job_hash TEXT PRIMARY KEY,
  total_score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  role_score INTEGER DEFAULT 0,
  remote_score INTEGER DEFAULT 0,
  contract_score INTEGER DEFAULT 0,
  language_score INTEGER DEFAULT 0,
  matched_skills TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  evaluated_at TEXT NOT NULL
);
