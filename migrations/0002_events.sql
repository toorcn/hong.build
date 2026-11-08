CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  end_at INTEGER,
  all_day INTEGER NOT NULL DEFAULT 0,
  date_local TEXT NOT NULL,
  region TEXT NOT NULL,
  place_tag TEXT,
  topic TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'event',
  location_text TEXT NOT NULL,
  signup_url TEXT NOT NULL,
  organizer TEXT,
  price TEXT,
  image_url TEXT,
  raw TEXT NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  removed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS events_visible ON events (removed, start_at);

CREATE TABLE IF NOT EXISTS event_ingests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  source TEXT,
  status TEXT NOT NULL,
  dry_run INTEGER NOT NULL DEFAULT 0,
  received INTEGER,
  added INTEGER,
  updated INTEGER,
  removed INTEGER,
  rejected INTEGER,
  detail TEXT
);
