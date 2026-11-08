export type Region = "kv" | "sg" | "online" | "other";
export type Topic = "ai" | "founder" | "hack" | "design" | "hardware" | "community";
export type Kind = "event" | "deadline";

/** One event after the Worker has cleaned it up; maps 1:1 onto the `events` table. */
export interface NormalizedEvent {
  id: string;
  name: string;
  startAt: number; // unix seconds
  endAt: number | null;
  allDay: boolean;
  dateLocal: string; // YYYY-MM-DD, Malaysia
  region: Region;
  placeTag: string | null;
  topic: Topic;
  kind: Kind;
  locationText: string;
  signupUrl: string;
  organizer: string | null;
  price: string | null;
  imageUrl: string | null;
  raw: string; // OpenClaw's original record, JSON
}

/** What GET /api/events returns per event. */
export interface PublicEvent {
  id: string;
  name: string;
  start: string; // ISO, UTC
  end: string | null;
  all_day: boolean;
  date: string; // YYYY-MM-DD, Malaysia
  region: Region;
  place_tag: string | null;
  topic: Topic;
  kind: Kind;
  location: string;
  url: string;
  organizer: string | null;
  price: string | null;
  image: string | null;
}

export interface EventsResponse {
  generated_at: string;
  last_ingest_at: string | null;
  tz: "Asia/Kuala_Lumpur";
  events: PublicEvent[];
}
