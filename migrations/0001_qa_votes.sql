CREATE TABLE IF NOT EXISTS qa_votes (
  question_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (question_id, voter_key)
);

CREATE TABLE IF NOT EXISTS qa_rate (
  ip_hash TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, bucket)
);
