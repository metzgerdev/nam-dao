import { aiProjects, craftProjects } from "../../data/projects";
import ProjectRow from "./ProjectRow";

function Work() {
  return (
    <main aria-label="Work">
      <section className="section shell" aria-labelledby="ai-work">
        <div className="section-head">
          <h2 className="section-title" id="ai-work">
            AI Engineering
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
            UI &amp; audio engineering
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
