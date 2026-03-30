import { useEffect, useState } from "react";
import Daw from "./DAW/Daw";
import Sequencer from "./View/Sequencer";

function readRoute() {
  const hashRoute = window.location.hash.replace(/^#\/?/, "");
  const pathRoute = window.location.pathname.split("/").filter(Boolean).at(-1);
  const nextRoute = hashRoute || pathRoute;

  if (nextRoute === "daw") {
    return "daw";
  }

  return "sequencer";
}

function App() {
  const [route, setRoute] = useState(readRoute);

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
      {route === "daw" ? <Daw /> : <Sequencer />}
    </div>
  );
}

export default App;
