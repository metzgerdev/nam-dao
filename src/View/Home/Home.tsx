import { craftProjects, featuredProjects } from "../../data/projects";
import ProjectRow from "../Work/ProjectRow";

const GITHUB_URL = "https://github.com/metzgerdev";
const LINKEDIN_URL = "https://www.linkedin.com/in/nam-dao";
// Forwarding alias, so it can be rotated without touching the real mailbox.
const EMAIL = "m5q2f1sf@anonaddy.me";

function Home() {
  return (
    <main aria-label="Home">
      <section className="hero shell">
        <p className="hero-name">Nam Dao — AI Engineer</p>

        <h1 className="hero-statement">Rigor meets craftsmanship.</h1>

        <p className="hero-summary">
          I build LLM systems with a niche in <em>audio</em> applications.
          Experience in RAG, evals, agents, custom models and post training. I
          have an electrical engineering background in signal processing, and
          eight years of shipping front-end software.
        </p>

        <div className="hero-meta">
          <span>Los Angeles</span>
          <span>MS Electrical Engineering, UW</span>
          <span>Previously NGINX, Rescale, Nintendo</span>
        </div>

        <div className="hero-links">
          <a className="link-button link-button--primary" href="#/work">
            Selected work
          </a>
          <a className="link-button" href={`mailto:${EMAIL}`}>
            Email
          </a>
          <a
            className="link-button"
            href={GITHUB_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="link-button"
            href={LINKEDIN_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
        </div>
      </section>

      <section className="section shell" aria-labelledby="selected-work">
        <div className="section-head">
          <h2 className="section-title" id="selected-work">
            Selected work
          </h2>
          <a className="section-link" href="#/work">
            All projects →
          </a>
        </div>

        <div className="project-list">
          {featuredProjects.map((project, index) => (
            <ProjectRow index={index} key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="section shell" aria-labelledby="demos">
        <div className="section-head">
          <h2 className="section-title" id="demos">
            Interactive demos
          </h2>
          <p className="section-note">Runs in the browser — no install</p>
        </div>

        <div className="demo-grid">
          {craftProjects.map((project) => (
            <a className="demo-card" href={project.demo} key={project.slug}>
              <p className="demo-card-label">Live</p>
              <h3 className="demo-card-name">{project.name}</h3>
              <p className="demo-card-copy">{project.tagline}</p>
              <span className="demo-card-cue">Open demo →</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
