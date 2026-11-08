interface Props {
  night: boolean;
  sound: boolean;
  keptCount: number;
  /** Changes on every Keep, replaying the wallet's bump. */
  bump: number;
  onNight(): void;
  onSound(): void;
  onWallet(): void;
}

export function TopBar({ night, sound, keptCount, bump, onNight, onSound, onWallet }: Props) {
  return (
    <header className="tx-top">
      <div className="tx-brand">
        <span className="logo" aria-hidden="true">B</span>
        <div>
          <h1>Builder Line</h1>
          <small>KL builder events</small>
        </div>
      </div>
      <div className="tx-icons">
        <button type="button" onClick={onNight} aria-pressed={night} aria-label="Night service">{night ? "☀️" : "🌙"}</button>
        <button type="button" onClick={onSound} aria-pressed={sound} aria-label="Station chime">{sound ? "🔔" : "🔇"}</button>
        <button key={bump} type="button" className={bump ? "bump" : undefined} onClick={onWallet} aria-label={`My Journey, ${keptCount} kept`}>
          🎟 <span>{keptCount}</span>
        </button>
      </div>
    </header>
  );
}
