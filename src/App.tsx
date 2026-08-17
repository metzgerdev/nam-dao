import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState, type MouseEvent } from "react";
import { createAppQueryClient } from "./queryClient";
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
  const hashRoute = window.location.hash.replace(/^#\/?/, "");
  const [hashSegment, hashParam] = hashRoute.split("/");
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const pathRoute = pathSegments[pathSegments.length - 1];
  const nextRoute = hashSegment || pathRoute;

  if (nextRoute === "work") {
    return hashParam
      ? { name: "work-detail", param: hashParam }
      : { name: "work" };
  }

  // "writing" is the label in the nav; "blog" is kept so older links resolve.
  if (nextRoute === "blog" || nextRoute === "writing") {
    return { name: "blog" };
  }

  if (nextRoute === "music-player") {
    return { name: "music-player" };
  }

  if (nextRoute === "sequencer") {
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

    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
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

    if (route.name === "blog") {
      return <Blog />;
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

  /**
   * Home is the empty-hash fallback, so the brand navigates to the bare base
   * URL rather than "#/home" — that keeps the landing address clean. Modified
   * clicks fall through to the href so new-tab still works.
   */
  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, "", import.meta.env.BASE_URL);
    setRoute(readRoute());
  }

  const isWork = route.name === "work" || route.name === "work-detail";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-frame">
        <nav className="site-nav" aria-label="Primary">
          <div className="site-nav-inner">
            <a
              className="site-nav-brand"
              href={import.meta.env.BASE_URL}
              onClick={goHome}
            >
              Nam&nbsp;Dao
            </a>
            <div className="site-nav-links">
              <a className={isWork ? "active" : ""} href="#/work">
                Work
              </a>
              <a
                className={route.name === "blog" ? "active" : ""}
                href="#/blog"
              >
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
              <a href="#/work">Work</a>
              <a href="#/blog">Writing</a>
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
