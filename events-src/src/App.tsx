import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackToNow } from "./components/BackToNow";
import { Guide } from "./components/Guide";
import { Line } from "./components/Line";
import { PlatformDisplay } from "./components/PlatformDisplay";
import { Sheet } from "./components/Sheet";
import { Ticket } from "./components/Ticket";
import { Toast } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { Wallet } from "./components/Wallet";
import { useIsDesktop, useReducedMotion } from "./hooks/useMedia";
import { useNow } from "./hooks/useNow";
import { loadTimetable, staleDays, type Load } from "./lib/api";
import { readPref, writePref } from "./lib/prefs";
import { chime, tick, unlockSound } from "./lib/sound";
import { dayLabel, mytDateKey } from "./lib/time";
import { buildTimetable, dayEvents } from "./lib/timetable";
import type { PublicEvent } from "./types";

type Panel = { kind: "ticket"; id: string } | { kind: "wallet" } | { kind: "guide" } | null;

const prefersDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export default function App() {
  const [load, setLoad] = useState<Load | null>(null);
  const now = useNow();
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();
  const [current, setCurrent] = useState(0);
  const [kept, setKept] = useState<Set<string>>(() => new Set(readPref<string[]>("kept", [])));
  const [bump, setBump] = useState(0);
  const [night, setNight] = useState<boolean>(() => readPref<boolean | null>("night", null) ?? prefersDark());
  const [sound, setSound] = useState<boolean>(() => readPref<boolean>("sound", false));
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const deepLinked = useRef(false);

  const refresh = useCallback(() => {
    void loadTimetable().then(setLoad);
  }, []);
  useEffect(refresh, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle("night", night);
  }, [night]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const data = load && load.state !== "error" ? load.data : null;
  const days = useMemo(() => (data ? buildTimetable(data.events, now) : []), [data, now]);
  const byId = useMemo(() => new Map((data?.events ?? []).map((e) => [e.id, e])), [data]);

  // A shared link (#e=<id>) opens its ticket once the timetable has loaded.
  useEffect(() => {
    if (!data || deepLinked.current) return;
    deepLinked.current = true;
    const match = /^#e=([0-9a-f]{16})$/.exec(location.hash);
    if (!match) return;
    if (byId.has(match[1]!)) setPanel({ kind: "ticket", id: match[1]! });
    else {
      setToast("That event has left the line");
      history.replaceState(null, "", location.pathname);
    }
  }, [data, byId]);

  const play = (sfx: () => void) => {
    if (!sound) return;
    unlockSound();
    sfx();
  };

  const openTicket = (id: string) => {
    if (!panel) opener.current = document.activeElement as HTMLElement | null;
    setPanel({ kind: "ticket", id });
    history.replaceState(null, "", `#e=${id}`);
  };

  const closePanel = useCallback(() => {
    setPanel(null);
    history.replaceState(null, "", location.pathname);
  }, []);

  // Return focus to whatever opened the panel, after the background is no longer inert.
  const wasOpen = useRef(false);
  const isOpen = panel !== null;
  useEffect(() => {
    if (isOpen) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      opener.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const selectDay = (i: number) => {
    setCurrent(i);
    play(chime);
  };
  const passDay = (i: number) => {
    setCurrent(i);
    play(tick);
  };

  const toggleKeep = (id: string) => {
    const next = new Set(kept);
    const adding = !next.has(id);
    if (adding) next.add(id);
    else next.delete(id);
    setKept(next);
    writePref("kept", [...next]);
    setBump((b) => b + 1);
    if (adding) play(chime);
  };

  const share = async (e: PublicEvent) => {
    const url = `https://events.hong.build/#e=${e.id}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: e.name, url });
        return;
      } catch (err) {
        // Dismissing the share sheet is a choice, not a failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      setToast("Couldn't copy the link");
    }
  };

  const toggleNight = () => {
    const value = !night;
    setNight(value);
    writePref("night", value);
  };

  const toggleSound = () => {
    const value = !sound;
    setSound(value);
    writePref("sound", value);
    if (value) {
      unlockSound();
      chime();
    }
  };

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
  const openEvent = panel?.kind === "ticket" ? (byId.get(panel.id) ?? null) : null;
  const keptEvents = [...kept]
    .map((id) => byId.get(id))
    .filter((e): e is PublicEvent => e !== undefined)
    .sort((a, b) => a.start.localeCompare(b.start));

  const sheet = (
    <Sheet
      open={panel !== null}
      variant={desktop ? "panel" : "sheet"}
      label={panel?.kind === "wallet" ? "My Journey" : panel?.kind === "guide" ? "Guide" : (openEvent?.name ?? "Ticket")}
      onClose={closePanel}
    >
      {panel?.kind === "guide" ? (
        <Guide onClose={closePanel} />
      ) : panel?.kind === "wallet" ? (
        <Wallet events={keptEvents} onOpen={openTicket} />
      ) : openEvent ? (
        <Ticket
          event={openEvent}
          now={now}
          kept={kept.has(openEvent.id)}
          onToggleKeep={() => toggleKeep(openEvent.id)}
          onShare={() => void share(openEvent)}
          onClose={closePanel}
        />
      ) : null}
    </Sheet>
  );

  return (
    <div className="shell">
      <main className="tx">
        <div className="bg" style={{ display: "contents" }} inert={!desktop && panel !== null}>
        <Line
          days={days}
          todayKey={todayKey}
          now={now}
          current={at}
          kept={kept}
          reduced={reduced}
          scrollRef={scrollRef}
          onSelectDay={selectDay}
          onPassDay={passDay}
          onOpen={openTicket}
          emptyMessage={
            load.data.events.length === 0 ? (
              <p className="tx-none">
                No departures yet. <a href="webcal://events.hong.build/events.ics">Subscribe</a> to get new ones as they’re added.
              </p>
            ) : null
          }
        />
        <div className="tx-fade" aria-hidden="true" />
        <TopBar
          night={night}
          sound={sound}
          keptCount={keptEvents.length}
          bump={bump}
          onNight={toggleNight}
          onSound={toggleSound}
          onGuide={() => {
            opener.current = document.activeElement as HTMLElement | null;
            setPanel({ kind: "guide" });
          }}
          onWallet={() => {
            opener.current = document.activeElement as HTMLElement | null;
            setPanel({ kind: "wallet" });
          }}
        />
        <PlatformDisplay day={days[at]} todayKey={todayKey} now={now} reduced={reduced} notice={notice} fallback={fallback} onOpen={openTicket} events={load.data.events} />
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
            selectDay(0);
          }}
        />
        </div>
        {!desktop && sheet}
        <Toast message={toast} />
      </main>
      {desktop && <aside className="aside" aria-label="Ticket">{sheet}</aside>}
    </div>
  );
}
