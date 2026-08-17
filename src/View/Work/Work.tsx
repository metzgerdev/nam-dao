import { aiProjects, craftProjects } from "../../data/projects";
import ProjectRow from "./ProjectRow";

function Work() {
  return (
    <main aria-label="Work">
      <section className="hero shell">
        <p className="hero-name">Work</p>
        <h1 className="hero-statement">
          Systems, and how they were <em>measured</em>.
        </h1>
        <p className="hero-summary">
          Each project below links to its repository. Where a system produced
          numbers, the numbers are here — including the ones that are still
          modest, and the caveats that qualify them.
        </p>
      </section>

      <section className="section shell" aria-labelledby="ai-work">
        <div className="section-head">
          <h2 className="section-title" id="ai-work">
            AI &amp; machine learning
          </h2>
          <p className="section-note">{aiProjects.length} projects</p>
        </div>

        <div className="project-list">
          {aiProjects.map((project, index) => (
            <ProjectRow index={index} key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="section shell" aria-labelledby="craft-work">
        <div className="section-head">
          <h2 className="section-title" id="craft-work">
            Interface &amp; audio engineering
          </h2>
          <p className="section-note">Live in the browser</p>
        </div>

        <div className="project-list">
          {craftProjects.map((project, index) => (
            <ProjectRow index={index} key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Work;
