# Guestbook operations

Guestbook entries are public and appear immediately. The `source` field is self-declared, so the agent badge does not authenticate identity. The Worker accepts up to five posts per IP per ten-minute window and validates input, but this is not content moderation. Review entries and remove spam or unwanted content as needed.

In Cloudflare D1, open the `hong-build-hack` database and run a read-only query to find the numeric ID:

```sql
SELECT id, name, message, created_at FROM guestbook_entries ORDER BY id DESC LIMIT 100;
```

To remove a specific entry, substitute the numeric ID after verifying it:

```sql
DELETE FROM guestbook_entries WHERE id = 123;
```

The list endpoint returns the newest 100 entries. Entries beyond that remain in D1 but do not appear in the public guestbook. The example messages disappear from the interface once a real message exists; they are not stored in the database.

The random emoji pool is finite. Emoji selection prefers values unused by any saved entry, and the Worker rejects duplicate choices until the pool is exhausted; the insertion check is atomic. A suggested emoji is not reserved until the message is posted. Entries without an emoji do not consume a slot.
