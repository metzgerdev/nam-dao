import type { Project } from "../../data/projects";
import { hrefFor } from "../../routing";

interface ProjectRowProps {
  index: number;
  project: Project;
}

function ProjectRow({ index, project }: ProjectRowProps) {
  const position = String(index + 1).padStart(2, "0");

  return (
    <a className="project-row" href={hrefFor(`work/${project.slug}`)}>
      <span className="project-index" aria-hidden="true">
        {position}
      </span>

      <div>
        <h3 className="project-name">{project.name}</h3>
        <p className="project-tagline">{project.tagline}</p>
        {project.status ? (
          <p className="project-status">{project.status}</p>
        ) : null}
        <div className="tag-row">
          {project.stack.slice(0, 5).map((item) => (
            <span className="tag" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <dl className="project-metrics">
        {project.metrics.slice(0, 4).map((metric) => (
          <div className="metric" key={metric.label}>
            <dt className="metric-label">{metric.label}</dt>
            <dd className="metric-value">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </a>
  );
}

export default ProjectRow;
