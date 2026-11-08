# Pushing events to Builder Line (events.hong.build)

OpenClaw sends its **whole list of upcoming events** to the site once a day, and again whenever it finds new ones. The site updates in place; sending the same list twice changes nothing.

## Request

```bash
curl -sS -X POST https://events.hong.build/api/events/ingest \
  -H "Authorization: Bearer $EVENTS_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  --data @events.json
```

`events.json`:

```json
{
  "source": "openclaw",
  "events": [
    {
      "name": "Code Meets Animation - SwiftLah! Community x LottieFiles",
      "date_text": "Wednesday, 11 November 2026",
      "location_text": "Petaling Jaya",
      "signup_url": "https://luma.com/cwe18vhn"
    }
  ]
}
```

### Required per event
| Field | Notes |
|---|---|
| `name` | ≤ 200 characters |
| `date_text` | e.g. `Wednesday, 11 November 2026`, `11 Nov 2026`, `Nov 11, 2026`, `2026-11-11`. Not needed if `start` is sent. |
| `location_text` | City or venue, e.g. `Petaling Jaya`, `Singapore`, `Online` |
| `signup_url` | Must be `https://`. This is the event's identity — keep it stable. |

### Optional per event (send whenever the event page shows it)
| Field | Effect |
|---|---|
| `start`, `end` | ISO 8601 with offset, e.g. `2026-11-11T19:00:00+08:00`. Turns "All day" into a time and enables LIVE / BOARDING. |
| `organizer` | Shown as HOST on the ticket. |
| `topic` | One of `ai`, `founder`, `hack`, `design`, `hardware`, `community`. Otherwise guessed from the name. |
| `region` | One of `kv`, `sg`, `online`, `other`. Otherwise worked out from `location_text`. |
| `kind` | `deadline` for applications/grants (shown as CLOSES IN …), else `event`. |
| `price`, `image_url` | Free text; `https://` image. |

Luma pages show the start time, host and cover image — include them when available.

### Request options
| Option | Use |
|---|---|
| `"dry_run": true` | Validate and report without saving. Use while setting up. |
| `"allow_shrink": true` | Only when intentionally clearing most of the timetable. Without it, a push that would hide more than half the upcoming events (or contains none) is refused with `409` and nothing changes. |

An event you leave out of a push is hidden by its id (the `signup_url`), and comes back if a later push includes it again. Events are deleted for good 30 days after they end (or after they start, if no end is given).

## Responses
| Status | Meaning | What to do |
|---|---|---|
| `200` | Saved (or dry-run report). Body: `added`, `updated`, `removed`, `rejected[]`, `warnings[]`. | Fix each `rejected[].reason` and `warnings[].message` in the next push. |
| `401` | Token missing or wrong. | Check `EVENTS_INGEST_TOKEN`. |
| `400` | Body isn't JSON or has no `events` array. | Fix the payload. |
| `409` | Shrink guard: the push looked broken. Body: `current`, `accepted`. | Check the scrape; resend the full list. |
| `413` | Over 1 MB or over 1000 events. | Send only upcoming events. |

Each push is saved all-or-nothing: if it fails part-way (for example a `5xx`), nothing from it is kept, so it is safe to send the same push again.

## Instructions to give OpenClaw

> Every day at 08:00 Malaysia time, and right after you discover new events, send the complete list of upcoming KL builder / tech / startup events you know about (plus any Singapore, online or international opportunities) to `https://events.hong.build/api/events/ingest` as described in this guide, using the `EVENTS_INGEST_TOKEN` secret as a Bearer token. Always include `name`, `date_text` (or `start`), `location_text` and `signup_url`. When an event page shows a start time, end time, host or cover image, include `start`, `end`, `organizer` and `image_url`. Send `topic` and `region` when you are sure of them. Mark application or grant deadlines with `"kind": "deadline"`. Never send `allow_shrink` unless I ask. After each push, read the response: if anything is in `rejected` or `warnings`, correct those events and push again; if you get `409`, do not retry blindly — tell me what happened.
