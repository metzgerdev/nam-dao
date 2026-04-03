import type { MusicTrack } from "../mockMusicPlayerApi";

function formatPlaybackTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface LibrarySidebarProps {
  activeTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  trackDurations: Record<string, number>;
  tracks: MusicTrack[];
}

function LibrarySidebar({
  activeTrackId,
  onSelectTrack,
  trackDurations,
  tracks,
}: LibrarySidebarProps) {
  return (
    <aside className="music-player-library-card">
      <div className="music-player-library-header">
        <div>
          <h3>Tracks</h3>
        </div>
      </div>
      <div className="music-player-library-list" role="list">
        {tracks.map((track, index) => (
          <button
            aria-label={`Select ${track.title}`}
            aria-pressed={track.id === activeTrackId}
            className={[
              "music-player-library-track",
              track.id === activeTrackId ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            type="button"
          >
            <span className="music-player-library-index">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <span className="music-player-library-copy">
              <strong>{track.title}</strong>
              <span>
                {track.album} | {" "}
                {trackDurations[track.id]
                  ? formatPlaybackTime(trackDurations[track.id] ?? 0)
                  : "…"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default LibrarySidebar;
