const PROFILE_HIGHLIGHTS = [
  {
    label: "Creative Engineering",
    value:
      "I like turning ideas into working things, especially interactive tools that feel tactile, alive, and human centric.",
  },
  {
    label: "Music Under Zynar",
    value:
      "I release music as Zynar, obessing over what the user experiences, with extreme attention to detail.",
  },
  {
    label: "Maker Mentality",
    value:
      "Outside of software and music, I wrench on my own cars, and draw inspiration from car design. I’m happiest making, fixing, and refining with my hands.",
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
              I’m a software engineer with a strong maker streak. I have 8+
              years experience as a front end developer, make electronic music
              as Zynar, and spend time in the garage wrenching on cars.
            </p>
            <p className="home-summary">
              Creativity is the through-line for me: code, sound, machines, and
              the satisfaction of delivering high impact products.
            </p>
            <p className="home-summary">
              I&apos;ve previously worked at NGINX / F5, Rescale, and Nintendo
              of America, and I&apos;m currently looking for a new opportunity
              where I can keep building thoughtful, creative products. I have
              an MS in Electrical Engineering from University of Washington,
              and attended the Hack Reactor software accelerator to pivot
              toward web engineering. I&apos;m currently attending the New Line
              AI accelerator to control the AI or else be controlled by the AI.
              😂
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
