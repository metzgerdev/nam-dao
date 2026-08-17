import type { ReactNode } from "react";
import { projectBySlug } from "../../data/projects";
import { hrefFor } from "../../routing";

interface DemoFrameProps {
  children: ReactNode;
  slug: string;
}

/**
 * Wraps an instrument view with enough context that someone arriving from a
 * direct link knows what they are looking at, and can reach the write-up.
 */
function DemoFrame({ children, slug }: DemoFrameProps) {
  const project = projectBySlug(slug);

  return (
    <div className="demo-shell demo-stage">
      {project ? (
        <header className="demo-stage-head">
          <a className="case-back" href={hrefFor("work")}>
            ← Work
          </a>
          <h1>{project.name}</h1>
          <p>{project.tagline}</p>
          <p className="demo-stage-cue">
            <a className="section-link" href={hrefFor(`work/${project.slug}`)}>
              Read how it was built →
            </a>
          </p>
        </header>
      ) : null}
      {children}
    </div>
  );
}

export default DemoFrame;
