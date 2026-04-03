const PLAYLIST = [
  {
    label: "Now Playing",
    title: "Night Drive Through Fremont",
    copy: "Warm pads, punchy drums, and enough movement to feel like a late set at 1:12 AM.",
  },
  {
    label: "In Queue",
    title: "Concrete Echoes",
    copy: "A darker synth sketch with a rolling bassline and a chorus that finally clicks.",
  },
  {
    label: "Library",
    title: "Zynar Demos",
    copy: "Ideas in progress, rough bounces, and fragments that might become a finished release.",
  },
];

function MusicPlayer() {
  return (
    <main className="music-player">
      <section className="music-player-shell">
        <div className="music-player-hero">
          <section className="music-player-copy">
            <p className="home-kicker">Music Player</p>
            <h1>Built for rough mixes and repeat listens.</h1>
            <p className="music-player-summary">
              A route for the listening side of the project. Think quick access
              to sketches, playlists, and playback controls without leaving the
              rest of the music playground behind.
            </p>
            <div className="music-player-actions" aria-label="Music player controls">
              <button className="music-player-button" type="button">
                Play
              </button>
              <button className="music-player-button music-player-button--secondary" type="button">
                Queue Next
              </button>
            </div>
          </section>

          <aside className="music-player-panel" aria-label="Playlist preview">
            {PLAYLIST.map((item) => (
              <article className="music-player-card" key={item.title}>
                <p className="music-player-label">{item.label}</p>
                <h2>{item.title}</h2>
                <p className="music-player-card-copy">{item.copy}</p>
              </article>
            ))}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default MusicPlayer;
