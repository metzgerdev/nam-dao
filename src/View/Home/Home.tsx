const PROFILE_HIGHLIGHTS = [
  {
    label: "Creative Engineering",
    value:
      "I like turning ideas into working things, especially interactive tools that feel tactile, musical, and alive.",
  },
  {
    label: "Music Under Zynar",
    value:
      "I release music as Zynar, and that same instinct for rhythm and texture shows up in the products I build.",
  },
  {
    label: "Maker Mentality",
    value:
      "Outside software, I wrench on my own cars. I’m happiest making, fixing, and refining with my hands.",
  },
];

function Home() {
  return (
    <main className="home">
      <section className="home-shell">
        <div className="home-hero">
          <div className="home-portrait-panel">
            <img
              alt="Portrait of Nam Dao"
              className="home-portrait"
              src="./nam-dao-profile.jpg"
            />
          </div>

          <div className="home-copy">
            <p className="home-kicker">Home</p>
            <h1>Nam Dao</h1>
            <p className="home-summary">
              I’m a software engineer with a strong maker streak. I build
              playful, polished tools, make music as Zynar, and spend time in
              the garage working on my own cars.
            </p>
            <p className="home-summary">
              Creativity is the through-line for me: code, sound, mechanical
              work, and the satisfaction of making something real.
            </p>

            <div className="home-actions">
              <a className="home-action home-action--primary" href="#/sequencer">
                Explore Sequencer
              </a>
              <a className="home-action" href="#/daw">
                Explore DAW
              </a>
              <a
                className="home-action"
                href="https://open.spotify.com/artist/3lKDd5smaYVrRmawXlWn7O"
                rel="noreferrer"
                target="_blank"
              >
                Listen to Zynar
              </a>
            </div>
          </div>
        </div>

        <section className="home-highlights" aria-label="Profile highlights">
          {PROFILE_HIGHLIGHTS.map((highlight) => (
            <article className="home-highlight-card" key={highlight.label}>
              <p className="home-highlight-label">{highlight.label}</p>
              <p className="home-highlight-value">{highlight.value}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default Home;
