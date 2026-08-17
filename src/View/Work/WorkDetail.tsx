import { projectBySlug } from "../../data/projects";
import { hrefFor } from "../../routing";

interface WorkDetailProps {
  slug: string;
}

function WorkDetail({ slug }: WorkDetailProps) {
  const project = projectBySlug(slug);

  if (!project) {
    return (
      <main aria-label="Project not found">
        <section className="case shell">
          <a className="case-back" href={hrefFor("work")}>
            ← Work
          </a>
          <h1 className="case-title">Not found</h1>
          <p className="case-tagline">
            There is no project at that address. Try the{" "}
            <a href={hrefFor("work")}>work index</a>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main aria-label={project.name}>
      <article className="case shell">
        <a className="case-back" href={hrefFor("work")}>
          ← Work
        </a>

        <header className="case-header">
          <h1 className="case-title">{project.name}</h1>
          <p className="case-tagline">{project.tagline}</p>

          {project.status ? (
            <p className="project-status">{project.status}</p>
          ) : null}

          <div className="tag-row">
            {project.stack.map((item) => (
              <span className="tag" key={item}>
                {item}
              </span>
            ))}
          </div>
        </header>

        {project.metrics.length > 0 ? (
          <dl className="case-metrics">
            {project.metrics.map((metric) => (
              <div className="case-metric" key={metric.label}>
                <dd className="case-metric-value">{metric.value}</dd>
                <dt className="case-metric-label">{metric.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="case-section">
          {project.description.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <footer className="case-footer">
          <div className="hero-links">
            {project.repo ? (
              <a
                className="link-button"
                href={project.repo}
                rel="noopener noreferrer"
                target="_blank"
              >
                View repository
              </a>
            ) : null}
            {project.demo ? (
              <a
                className="link-button link-button--primary"
                href={hrefFor(project.demo ?? "")}
              >
                Open live demo
              </a>
            ) : null}
          </div>
          <a className="section-link" href={hrefFor("work")}>
            All projects →
          </a>
        </footer>
      </article>
    </main>
  );
}

export default WorkDetail;
