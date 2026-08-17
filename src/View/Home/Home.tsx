import { craftProjects, featuredProjects } from "../../data/projects";
import ProjectRow from "../Work/ProjectRow";

const GITHUB_URL = "https://github.com/metzgerdev";
const LINKEDIN_URL = "https://www.linkedin.com/in/nam-dao";

function Home() {
  return (
    <main aria-label="Home">
      <section className="hero shell">
        <p className="hero-name">Nam Dao — AI Engineer</p>

        <h1 className="hero-statement">
          I build LLM systems with a niche in <em>audio</em> applications.
        </h1>

        <p className="hero-summary">
          Small models that generate music, retrieval systems measured against
          real benchmarks, and evaluation pipelines that keep an LLM judge
          honest. An electrical engineering background in signal processing, and
          eight years of shipping front-end software before that.
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

      <section className="section shell" aria-labelledby="background">
        <div className="section-head">
          <h2 className="section-title" id="background">
            Background
          </h2>
        </div>

        <div className="background-grid">
          <div className="prose">
            <p>
              I moved into AI engineering from a front-end career, which turns
              out to be a useful combination. Most of the work in an LLM system
              is not the model call — it is the data pipeline feeding it, the
              evaluation harness telling you whether a change helped, and the
              interface a human uses to stay in the loop. I have built all
              three.
            </p>
            <p>
              The audio specialisation is not decorative. An MS in electrical
              engineering means I can read the DSP underneath a neural audio
              codec, and producing electronic music means I know what the output
              is supposed to sound like. That combination is rare enough to be
              worth pointing at.
            </p>
          </div>

          <dl className="fact-list">
            <div>
              <dt>Focus</dt>
              <dd>LLM systems, generative audio, retrieval and evaluation</dd>
            </div>
            <div>
              <dt>Tools</dt>
              <dd>
                Python · PyTorch · Hugging Face · FAISS · LangGraph · Pydantic ·
                TypeScript
              </dd>
            </div>
            <div>
              <dt>Education</dt>
              <dd>
                MS Electrical Engineering, University of Washington · Hack
                Reactor · New Line AI accelerator
              </dd>
            </div>
            <div>
              <dt>Also</dt>
              <dd>Produces house music as Zynar</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}

export default Home;
