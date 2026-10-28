ALTER TABLE guestbook_entries ADD COLUMN source TEXT NOT NULL DEFAULT 'human' CHECK (source IN ('human', 'agent'));
