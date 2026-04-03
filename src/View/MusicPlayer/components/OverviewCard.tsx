import type { MusicTrack } from "../mockMusicPlayerApi";

interface OverviewCardProps {
  track: MusicTrack;
}

function OverviewCard({ track }: OverviewCardProps) {
  return (
    <section className="music-player-overview-card">
      <div className="music-player-artwork-frame">
        <img
          alt={track.artwork.alt ?? `${track.title} artwork`}
          className="music-player-artwork"
          src={track.artwork.src}
        />
      </div>
      <div className="music-player-overview-copy">
        <h2 className="music-player-overview-title">{track.title}</h2>
        <p className="music-player-summary music-player-overview-summary">
          {track.description}
        </p>
        <div className="music-player-meta-grid">
          <article className="music-player-meta-card">
            <span>Artist</span>
            <strong className="music-player-meta-value">{track.artist}</strong>
          </article>
          <article className="music-player-meta-card">
            <span>Album</span>
            <strong className="music-player-meta-value">{track.album}</strong>
          </article>
          <article className="music-player-meta-card">
            <span>BPM</span>
            <strong className="music-player-meta-value">{track.bpm}</strong>
          </article>
          <article className="music-player-meta-card">
            <span>Release</span>
            <strong className="music-player-meta-value">{track.year}</strong>
          </article>
        </div>
      </div>
    </section>
  );
}

export default OverviewCard;
