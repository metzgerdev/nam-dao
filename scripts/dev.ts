import { watch } from "node:fs";
import path from "node:path";
import { buildApp } from "./build";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, "dist");
const WATCH_TARGETS = ["src", "public", "index.html", "package.json"];

const port = Number(Bun.env.PORT ?? 3000);

let rebuildInFlight = false;
let rebuildQueued = false;

async function rebuild(): Promise<void> {
  if (rebuildInFlight) {
    rebuildQueued = true;
    return;
  }

  rebuildInFlight = true;

  try {
    await buildApp({ production: false });
  } catch (error) {
    console.error("Bun rebuild failed.");
    console.error(error);
  } finally {
    rebuildInFlight = false;
  }

  if (rebuildQueued) {
    rebuildQueued = false;
    await rebuild();
  }
}

await rebuild();

const watchers = WATCH_TARGETS.map((target) =>
  watch(path.join(ROOT_DIR, target), { recursive: true }, (_event, filename) => {
    const changedPath = filename ? `${target}/${filename}` : target;
    console.log(`Change detected in ${changedPath}`);
    void rebuild();
  })
);

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const assetPath = path.join(DIST_DIR, pathname);
    const asset = Bun.file(assetPath);

    if (await asset.exists()) {
      return new Response(asset);
    }

    return new Response(Bun.file(path.join(DIST_DIR, "index.html")));
  },
});

console.log(`Bun dev server running at http://localhost:${server.port}`);

function shutdown(): never {
  watchers.forEach((watcher) => watcher.close());
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
