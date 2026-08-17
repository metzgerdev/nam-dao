import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { migrateLegacyHash } from "./routing";
import "./Style/index.css";

// Must run before the first render so App reads the corrected path. Rewrites
// legacy "#/work/midi-gpt" URLs to "/nam-dao/work/midi-gpt" in place.
migrateLegacyHash();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container was not found.");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
