import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState } from "react";
import { createAppQueryClient } from "./queryClient";
import { currentPath, hrefFor, isInternalNavigation } from "./routing";
import DemoFrame from "./View/Work/DemoFrame";

const Blog = lazy(() => import("./View/Blog/Blog"));
const Home = lazy(() => import("./View/Home/Home"));
const MusicPlayer = lazy(() => import("./View/MusicPlayer/MusicPlayer"));
const Sequencer = lazy(() => import("./View/DrumMachine/Sequencer"));
const Work = lazy(() => import("./View/Work/Work"));
const WorkDetail = lazy(() => import("./View/Work/WorkDetail"));

const GITHUB_URL = "https://github.com/metzgerdev";
const LINKEDIN_URL = "https://www.linkedin.com/in/nam-dao";
// Forwarding alias, so it can be rotated without touching the real mailbox.
const EMAIL = "m5q2f1sf@anonaddy.me";

type RouteName =
  | "blog"
  | "blog-article"
  | "home"
  | "music-player"
  | "sequencer"
  | "work"
  | "work-detail";

interface Route {
  name: RouteName;
  param?: string;
}

function readRoute(): Route {
  const [segment, param] = currentPath().split("/");

  if (segment === "work") {
    return param ? { name: "work-detail", param } : { name: "work" };
  }

  // "writing" is the nav label; "blog" is the canonical path.
  if (segment === "blog" || segment === "writing") {
    return param ? { name: "blog-article", param } : { name: "blog" };
  }

  if (segment === "music-player") {
    return { name: "music-player" };
  }

  if (segment === "sequencer") {
    return { name: "sequencer" };
  }

  return { name: "home" };
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [queryClient] = useState(createAppQueryClient);

  useEffect(() => {
    function syncRoute() {
      setRoute(readRoute());
    }

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  // One delegated listener turns every in-app anchor into a pushState
  // navigation, so individual links stay plain hrefs that still work if
  // JavaScript never runs — which is what the prerendered pages rely on.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || !isInternalNavigation(anchor, event)) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      event.preventDefault();

      if (url.pathname !== window.location.pathname) {
        window.history.pushState(null, "", url.pathname);
        setRoute(readRoute());
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Land at the top of a newly opened view rather than mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, route.param]);

  function renderRoute() {
    if (route.name === "work") {
      return <Work />;
    }

    if (route.name === "work-detail") {
      return <WorkDetail slug={route.param ?? ""} />;
    }

    if (route.name === "blog" || route.name === "blog-article") {
      return <Blog slug={route.param} />;
    }

    // The instrument views are wrapped so a direct link still explains itself.
    if (route.name === "sequencer") {
      return (
        <DemoFrame slug="sequencer">
          <Sequencer />
        </DemoFrame>
      );
    }

    if (route.name === "music-player") {
      return (
        <DemoFrame slug="music-player">
          <MusicPlayer />
        </DemoFrame>
      );
    }

    return <Home />;
  }

  const isWork = route.name === "work" || route.name === "work-detail";
  const isBlog = route.name === "blog" || route.name === "blog-article";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-frame">
        <nav className="site-nav" aria-label="Primary">
          <div className="site-nav-inner">
            <a className="site-nav-brand" href={hrefFor("")}>
              Home
            </a>
            <div className="site-nav-links">
              <a className={isWork ? "active" : ""} href={hrefFor("work")}>
                Work
              </a>
              <a className={isBlog ? "active" : ""} href={hrefFor("blog")}>
                Writing
              </a>
              <a
                className="external"
                href={GITHUB_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>

        <div
          className="app-route-stage"
          key={`${route.name}/${route.param ?? ""}`}
        >
          <Suspense fallback={<p className="app-route-loading">Loading…</p>}>
            {renderRoute()}
          </Suspense>
        </div>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <span>Nam Dao — AI Engineer, Los Angeles</span>
            <div className="site-footer-links">
              <a href={hrefFor("work")}>Work</a>
              <a href={hrefFor("blog")}>Writing</a>
              <a href={`mailto:${EMAIL}`}>Email</a>
              <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
                GitHub
              </a>
              <a href={LINKEDIN_URL} rel="noopener noreferrer" target="_blank">
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
