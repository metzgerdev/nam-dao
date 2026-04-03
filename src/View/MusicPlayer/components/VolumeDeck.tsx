import type {
  ChangeEventHandler,
  CSSProperties,
  KeyboardEventHandler,
  PointerEventHandler,
} from "react";

const KNOB_MIN_ANGLE = -135;
const KNOB_MAX_ANGLE = 135;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function volumeToAngle(volume: number): number {
  return KNOB_MIN_ANGLE + clamp(volume, 0, 1) * (KNOB_MAX_ANGLE - KNOB_MIN_ANGLE);
}

interface VolumeDeckProps {
  onVolumeChange: ChangeEventHandler<HTMLInputElement>;
  onVolumeKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onVolumePointerDown: PointerEventHandler<HTMLDivElement>;
  onVolumePointerMove: PointerEventHandler<HTMLDivElement>;
  onVolumePointerRelease: PointerEventHandler<HTMLDivElement>;
  volume: number;
}

function VolumeDeck({
  onVolumeChange,
  onVolumeKeyDown,
  onVolumePointerDown,
  onVolumePointerMove,
  onVolumePointerRelease,
  volume,
}: VolumeDeckProps) {
  const volumeAngle = volumeToAngle(volume);
  const volumeIndicatorStyle = {
    transform: `translateX(-50%) rotate(${volumeAngle}deg)`,
  } as CSSProperties;

  return (
    <article className="music-player-volume-deck">
      <div className="music-player-volume-top">
        <div className="music-player-volume-led" aria-hidden="true" />
        <p className="music-player-label">Output</p>
      </div>
      <div
        aria-label="Volume"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(volume * 100)}
        className="music-player-volume-knob"
        onKeyDown={onVolumeKeyDown}
        onPointerCancel={onVolumePointerRelease}
        onPointerDown={onVolumePointerDown}
        onPointerMove={onVolumePointerMove}
        onPointerUp={onVolumePointerRelease}
        role="slider"
        tabIndex={0}
      >
        <span className="music-player-volume-ring" aria-hidden="true" />
        <span
          className="music-player-volume-indicator"
          aria-hidden="true"
          style={volumeIndicatorStyle}
        />
        <span className="music-player-volume-cap" aria-hidden="true" />
        <span className="music-player-volume-value">{Math.round(volume * 100)}</span>
      </div>
      <input
        id="music-player-volume"
        aria-label="Volume"
        className="music-player-volume-input"
        max="1"
        min="0"
        onChange={onVolumeChange}
        step="0.01"
        type="range"
        value={volume}
      />
      <div className="music-player-volume-footer">
      </div>
    </article>
  );
}

export default VolumeDeck;
