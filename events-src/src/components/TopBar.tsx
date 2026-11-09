import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";

interface Props {
  night: boolean;
  sound: boolean;
  keptCount: number;
  /** Changes on every Keep, replaying the wallet's bump. */
  bump: number;
  onNight(): void;
  onSound(): void;
  onWallet(): void;
  onGuide(): void;
}

export function TopBar({ night, sound, keptCount, bump, onNight, onSound, onWallet, onGuide }: Props) {
  return (
    <header className="tx-top">
      <div className="tx-brand">
        <BrandMark />
        <div>
          <h1>Builder Line</h1>
          <small>KL builder events</small>
        </div>
      </div>
      <div className="tx-icons">
        <button type="button" onClick={onGuide} aria-label="Guide: how Builder Line works">
          <Icon name="info" />
        </button>
        <button type="button" onClick={onNight} aria-pressed={night} aria-label="Night service"><Icon name={night ? "sun" : "moon"} /></button>
        <button type="button" onClick={onSound} aria-pressed={sound} aria-label="Station chime"><Icon name={sound ? "bell" : "bell-off"} /></button>
        <button key={bump} type="button" className={bump ? "bump" : undefined} onClick={onWallet} aria-label={`My Journey, ${keptCount} kept`}>
          <Icon name="ticket" />
          <span>{keptCount}</span>
        </button>
      </div>
    </header>
  );
}
