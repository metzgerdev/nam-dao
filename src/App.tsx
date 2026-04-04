import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Daw from "./View/DAW/Daw";
import Home from "./View/Home/Home";
import MusicPlayer from "./View/MusicPlayer/MusicPlayer";
import Sequencer from "./View/DrumMachine/Sequencer";
import TooFastTooFurious from "./View/TooFastTooFurious/TooFastTooFurious";
import { createAppQueryClient } from "./queryClient";

type RouteName =
  | "daw"
  | "home"
  | "music-player"
  | "sequencer"
  | "too-fast-too-furious";

function readRoute(): RouteName {
  const hashRoute = window.location.hash.replace(/^#\/?/, "");
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const pathRoute = pathSegments[pathSegments.length - 1];
  const nextRoute = hashRoute || pathRoute;

  if (nextRoute === "home") {
    return "home";
  }

  if (nextRoute === "daw") {
    return "daw";
  }+

  if (nextRoute === "music-player") {
    return "music-player";
  }

  if (nextRoute === "sequencer") {
    return "sequencer";
  }

  if (nextRoute === "too-fast-too-furious") {
    return "too-fast-too-furious";
  }

  return "home";
}

function App() {
  const [route, setRoute] = useState<RouteName>(readRoute);
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

  function renderRoute() {
    if (route === "home") {
      return <Home />;
    }

    if (route === "sequencer") {
      return <Sequencer />;
    }

    if (route === "daw") {
      return <Daw />;
    }

    if (route === "music-player") {
      return <MusicPlayer />;
    }

    return <TooFastTooFurious />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-frame">
        <nav className="app-route-nav" aria-label="Application views">
          <a className={route === "home" ? "active" : ""} href="#/home">
            Home
          </a>
          <a
            className={route === "sequencer" ? "active" : ""}
            href="#/sequencer"
          >
            Sequencer
          </a>
          <a className={route === "daw" ? "active" : ""} href="#/daw">
            DAW
          </a>
          <a
            className={route === "music-player" ? "active" : ""}
            href="#/music-player"
          >
            Music Player
          </a>
          <a
            className={route === "too-fast-too-furious" ? "active" : ""}
            href="#/too-fast-too-furious"
          >
            Machines
          </a>
        </nav>
        <div className="app-route-stage" key={route}>
          {renderRoute()}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
