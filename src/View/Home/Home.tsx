const PROJECTS = [
  {
    name: "Sequencer",
    href: "#/sequencer",
    description: "Roland 909 inspired drum machine",
  },
  {
    name: "DAW",
    href: "#/daw",
    description:
      "Digital Audio Workstation inspired by Ableton and vintage hi fi speakers",
  },
  {
    name: "Zynar",
    href: "https://open.spotify.com/artist/3lKDd5smaYVrRmawXlWn7O",
    description:
      "A stranger on the internet described my music as not terrible",
  },
  {
    name: "Cars",
    href: "#/too-fast-too-furious",
    description: "Restore and modify classic german cars",
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
              years experience as a front end developer. I’m highly collaborative
              with strong people skills. Obsessive over details that matter,
              which I cultivate also as a music producer and car enthusiast.
            </p>

            <p className="home-summary">
              I previously worked at NGINX (F5 Networks), Rescale, and Nintendo
              of America.
            </p>
            <p className="home-summary">
              I have an MS in Electrical Engineering from University of
              Washington, and attended the Hack Reactor software accelerator to
              pivot toward web engineering. I&apos;m currently attending the New
              Line AI accelerator to control the AI or risk being controlled by
              the AI. 🤖
            </p>
          </div>

          <aside className="home-projects" aria-label="Projects">
            <p className="home-kicker">Projects</p>
            <div className="home-project-list">
              {PROJECTS.map((project) => (
                <article className="home-project-card" key={project.name}>
                  <a
                    className="home-project-name"
                    href={project.href}
                    rel={
                      project.href.startsWith("http") ? "noreferrer" : undefined
                    }
                    target={
                      project.href.startsWith("http") ? "_blank" : undefined
                    }
                  >
                    {project.name}
                  </a>
                  <p className="home-project-description">
                    {project.description}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Home;
