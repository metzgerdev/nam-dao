import type { CSSProperties, ChangeEventHandler } from "react";

interface PlaybackDeckProps {
  currentTime: number;
  currentTimeLabel: string;
  durationLabel: string;
  errorMessage: string | null;
  isPlaying: boolean;
  maxDuration: number;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onSeekChange: ChangeEventHandler<HTMLInputElement>;
  onTogglePlayback: () => void;
  totalTimeLabel: string;
}

function PlaybackDeck({
  currentTime,
  currentTimeLabel,
  durationLabel,
  errorMessage,
  isPlaying,
  maxDuration,
  onNextTrack,
  onPreviousTrack,
  onSeekChange,
  onTogglePlayback,
  totalTimeLabel,
}: PlaybackDeckProps) {
  const progressPercent =
    maxDuration > 0 ? Math.min(currentTime / maxDuration, 1) * 100 : 0;
  const scrubberStyle = {
    background: `
      linear-gradient(
        90deg,
        rgba(var(--music-player-accent-warm-rgb), 0.98) 0%,
        rgba(var(--music-player-accent-magenta-rgb), 0.84) 62%,
        rgba(var(--music-player-accent-teal-rgb), 0.9) 100%
      ) 0 / ${progressPercent}% 100% no-repeat,
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.06) 0%,
        rgba(255, 255, 255, 0.015) 100%
      )
    `,
  } as CSSProperties;

  return (
    <article className="music-player-progress-card">
      <div className="music-player-progress-header">
        <div>
          <h3>Weiss DAC1-mk3</h3>
        </div>
        <strong>{totalTimeLabel}</strong>
      </div>
      <div className="music-player-timeline">
        <div className="music-player-timecode">
          <span>{currentTimeLabel}</span>
          <span>{durationLabel}</span>
        </div>
        <input
          aria-label="Seek within track"
          className={[
            "music-player-progress-input",
            isPlaying ? "is-playing" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          max={maxDuration > 0 ? maxDuration : 1}
          min="0"
          onChange={onSeekChange}
          step="0.01"
          style={scrubberStyle}
          type="range"
          value={Math.min(currentTime, maxDuration > 0 ? maxDuration : 1)}
        />
      </div>
      <div className="music-player-transport">
        <button
          aria-label="Previous track"
          className="music-player-transport-button"
          onClick={onPreviousTrack}
          type="button"
        >
          Prev
        </button>
        <button
          aria-label={isPlaying ? "Pause track" : "Play track"}
          className="music-player-transport-button music-player-transport-button--primary music-player-transport-button--playback"
          onClick={onTogglePlayback}
          type="button"
        >
          <span
            aria-hidden="true"
            className={[
              "music-player-transport-glyph",
              isPlaying ? "is-pause" : "is-play",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <span className="music-player-transport-label">
            {isPlaying ? "Pause" : "Play"}
          </span>
        </button>
        <button
          aria-label="Next track"
          className="music-player-transport-button"
          onClick={onNextTrack}
          type="button"
        >
          Next
        </button>
      </div>
      {errorMessage ? (
        <p className="music-player-inline-error">{errorMessage}</p>
      ) : null}
    </article>
  );
}

export default PlaybackDeck;
