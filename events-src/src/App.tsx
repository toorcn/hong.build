import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackToNow } from "./components/BackToNow";
import { Line } from "./components/Line";
import { PlatformDisplay } from "./components/PlatformDisplay";
import { TopBar } from "./components/TopBar";
import { useReducedMotion } from "./hooks/useMedia";
import { useNow } from "./hooks/useNow";
import { loadTimetable, staleDays, type Load } from "./lib/api";
import { readPref } from "./lib/prefs";
import { dayLabel, mytDateKey } from "./lib/time";
import { buildTimetable, dayEvents } from "./lib/timetable";

export default function App() {
  const [load, setLoad] = useState<Load | null>(null);
  const now = useNow();
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [kept] = useState<Set<string>>(() => new Set(readPref<string[]>("kept", [])));
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    void loadTimetable().then(setLoad);
  }, []);
  useEffect(refresh, [refresh]);

  const data = load && load.state !== "error" ? load.data : null;
  const days = useMemo(() => (data ? buildTimetable(data.events, now) : []), [data, now]);

  if (!load) return <div className="boot" aria-busy="true">Loading the timetable…</div>;
  if (load.state === "error") {
    return (
      <div className="boot">
        <p>We can’t reach the timetable right now.</p>
        <button type="button" onClick={refresh}>Try again</button>
      </div>
    );
  }

  const todayKey = mytDateKey(now);
  const at = Math.min(current, days.length - 1);
  const stale = staleDays(load.data, now);
  const notice =
    load.state === "cached" ? "SERVICE DISRUPTION · SHOWING SAVED TIMETABLE" : stale !== null ? `TIMETABLE UPDATED ${stale}D AGO` : null;
  const next = days.slice(at + 1).flatMap(dayEvents)[0];
  const fallback = next ? `NEXT: ${next.name.toUpperCase()} · ${dayLabel(next.date)}` : "CHECK BACK SOON";

  return (
    <div className="shell">
      <main className="tx">
        <Line
          days={days}
          todayKey={todayKey}
          now={now}
          current={at}
          kept={kept}
          reduced={reduced}
          scrollRef={scrollRef}
          onSelectDay={setCurrent}
          onPassDay={setCurrent}
          onOpen={() => undefined}
          emptyMessage={
            load.data.events.length === 0 ? (
              <p className="tx-none">
                No departures yet. <a href="webcal://events.hong.build/events.ics">Subscribe</a> to get new ones as they’re added.
              </p>
            ) : null
          }
        />
        <div className="tx-fade" aria-hidden="true" />
        <TopBar />
        <PlatformDisplay day={days[at]} todayKey={todayKey} now={now} reduced={reduced} notice={notice} fallback={fallback} onOpen={() => undefined} />
        {notice && (
          <div role="status" aria-label="Service notice" className="sr-only">{notice}</div>
        )}
        {load.state === "cached" && (
          <button type="button" className="retry" onClick={refresh}>Retry</button>
        )}
        <BackToNow
          scrollRef={scrollRef}
          onBack={() => {
            scrollRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            setCurrent(0);
          }}
        />
      </main>
      <aside className="aside" aria-label="Ticket" />
    </div>
  );
}
