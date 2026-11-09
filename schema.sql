-- Cloudflare D1 / SQLite Schema for Bolivia Remote Job Scout & Evaluator (v5.0.0)
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
);

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
);
