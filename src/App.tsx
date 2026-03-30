import { useEffect, useState } from "react";
import Daw from "./View/DAW/Daw";
import Home from "./View/Home/Home";
import Sequencer from "./View/DrumMachine/Sequencer";

type RouteName = "daw" | "home" | "sequencer";

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
  }

  if (nextRoute === "sequencer") {
    return "sequencer";
  }

  return "home";
}

function App() {
  const [route, setRoute] = useState<RouteName>(readRoute);

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

  return (
    <div className="app-frame">
      <nav className="app-route-nav" aria-label="Application views">
        <a
          className={route === "home" ? "active" : ""}
          href="#/home"
        >
          Home
        </a>
        <a
          className={route === "sequencer" ? "active" : ""}
          href="#/sequencer"
        >
          Sequencer
        </a>
        <a
          className={route === "daw" ? "active" : ""}
          href="#/daw"
        >
          DAW
        </a>
      </nav>
      {route === "home" ? <Home /> : null}
      {route === "sequencer" ? <Sequencer /> : null}
      {route === "daw" ? <Daw /> : null}
    </div>
  );
}

export default App;
