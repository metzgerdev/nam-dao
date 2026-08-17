/**
 * Prerender every route to a static HTML file.
 *
 * GitHub Pages serves static files, so writing dist/work/midi-gpt/index.html
 * makes that URL a real 200 with full markup. Crawlers that do not execute
 * JavaScript — Bing and most LLM crawlers — see the content, and each route
 * gets its own <title>/description/og tags.
 *
 * The app still boots and takes over on the client; this only changes what
 * arrives in the initial response.
 *
 * Usage: bun run scripts/prerender.ts   (runs automatically via `bun run build`)
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { projects } from "../src/data/projects";

const DIST = "dist";
const ORIGIN = "https://metzgerdev.github.io";
const BASE = "/nam-dao/";
const SITE_URL = `${ORIGIN}${BASE}`;
const PORT = 4173;
const BROWSE = `${process.env.HOME}/.claude/skills/gstack/browse/dist/browse`;

interface RouteSpec {
  path: string;
  /** Used instead of lifting the first paragraph off the page. */
  description?: string;
  /** Overrides the DOM-derived heading, where that heading is unsuitable. */
  title?: string;
}

const ROUTES: RouteSpec[] = [
  {
    path: "",
    description:
      "AI engineer in Los Angeles building LLM systems with a niche in audio applications. Retrieval, evaluation pipelines, agents, and custom generative music models.",
  },
  {
    path: "work",
    description:
      "Selected AI and machine learning projects by Nam Dao — retrieval benchmarks, evaluation pipelines, and generative audio models, with the numbers behind each.",
  },
  {
    path: "blog",
    description:
      "Writing by Nam Dao on audio, machine learning, and building creative tools.",
  },
  ...projects.map((p) => ({
    path: `work/${p.slug}`,
    description: p.description[0]?.slice(0, 300),
  })),
  // The article's own <h1> runs to ~90 characters, well past what a title tag
  // shows; use the short form from articles.ts instead.
  {
    path: "blog/musicgen-delay-pattern",
    title: "MusicGen: One Stream Instead of Many",
    description:
      "How a simple delay pattern turns parallel codebook streams into a single sequence a next-token model can generate.",
  },
  // The instruments render their own <h1> inside <main> ("FOLAND TR-909"),
  // which is the hardware's name, not the page's.
  {
    path: "sequencer",
    title: "Sequencer",
    description:
      "A TR-909 step sequencer with the audio engine kept out of React — timing and scheduling run through the Web Audio API. Live demo.",
  },
  {
    path: "music-player",
    title: "Music Player",
    description:
      "A music player with a K-weighted VU meter and a mock GraphQL data layer. Live demo.",
  },
];

function sh(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn(cmd, args, { encoding: "utf8" });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d));
    proc.stderr.on("data", (d) => (err += d));
    proc.on("close", (code) =>
      code === 0
        ? resolvePromise(out)
        : reject(new Error(err || `exit ${code}`)),
    );
  });
}

/** browse wraps some output in UNTRUSTED banners; strip them. */
function clean(value: string): string {
  return value
    .replace(/---\s*BEGIN UNTRUSTED[^\n]*\n?/gi, "")
    .replace(/---\s*END UNTRUSTED[\s\S]*$/gi, "")
    .trim();
}

async function evalInPage(expression: string): Promise<string> {
  return clean(await sh(BROWSE, ["js", expression]));
}

/** Prerendered routes are directory indexes, so their URL ends in a slash. */
function canonicalFor(path: string): string {
  return path ? `${SITE_URL}${path}/` : SITE_URL;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Swap the shell's shared metadata for values specific to this route. */
function applyMeta(
  html: string,
  meta: { title: string; description: string; url: string },
): string {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);

  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta name="description"\s+content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${meta.url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(
      /(<meta property="og:description"\s+content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${meta.url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(
      /(<meta name="twitter:description"\s+content=")[^"]*(")/,
      `$1${description}$2`,
    );
}

async function main() {
  const shell = await readFile(join(DIST, "index.html"), "utf8");

  /**
   * A local server with SPA fallback.
   *
   * Deliberately not `vite preview`: Vite answers 404 to any request carrying
   * `Sec-Fetch-Dest: script`, which is exactly what a browser sends for
   * <script type="module">, so the app never boots and every route captures an
   * empty shell. A plain static server has the opposite problem — it 404s
   * /work, because that file is what this script is about to create. Hence
   * both: serve real files when they exist, fall back to the shell otherwise.
   */
  const server = Bun.serve({
    port: PORT,
    async fetch(request) {
      const url = new URL(request.url);
      let path = url.pathname;
      path = path.startsWith(BASE) ? path.slice(BASE.length) : path.slice(1);
      path = path.replace(/^\/+|\/+$/g, "");

      if (path) {
        const file = Bun.file(join(DIST, path));
        if (await file.exists()) {
          return new Response(file);
        }
      }

      return new Response(shell, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  });

  await sh(BROWSE, ["viewport", "1280x900"]);

  const pages: { path: string; html: string; title: string }[] = [];

  for (const route of ROUTES) {
    await sh(BROWSE, ["goto", `http://localhost:${PORT}${BASE}${route.path}`]);

    // Wait for the route's <main>, so the lazy chunk has resolved.
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      const label = await evalInPage(
        "document.querySelector('main')?.getAttribute('aria-label') || ''",
      );
      if (label) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!ready) {
      throw new Error(`route never rendered: /${route.path}`);
    }

    const html = await evalInPage(
      "'<!doctype html>' + document.documentElement.outerHTML",
    );

    // Derive the title from what the page renders, so it cannot drift from
    // the content.
    const heading = await evalInPage(
      "(document.querySelector('main h1')?.textContent || document.querySelector('main')?.getAttribute('aria-label') || '').trim()",
    );

    const description =
      route.description ??
      (await evalInPage(
        "(document.querySelector('main p')?.textContent || '').trim().slice(0, 300)",
      ));

    const title =
      route.path === ""
        ? "Nam Dao — AI Engineer"
        : `${route.title ?? heading} — Nam Dao`;

    pages.push({
      path: route.path,
      title,
      html: applyMeta(html, {
        title,
        description,
        url: canonicalFor(route.path),
      }),
    });

    console.log(
      `  ${(route.path || "/").padEnd(30)} ${String(html.length).padStart(7)}b  ${title}`,
    );
  }

  server.stop(true);

  // Written only after every route is captured, so overwriting the shell
  // mid-run cannot affect the SPA fallback.
  for (const page of pages) {
    const dir = page.path ? join(DIST, page.path) : DIST;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), page.html + "\n", "utf8");
  }

  const urls = pages
    .map(
      (p) =>
        `  <url>\n    <loc>${canonicalFor(p.path)}</loc>\n    <priority>${
          p.path === "" ? "1.0" : "0.8"
        }</priority>\n  </url>`,
    )
    .join("\n");
  await writeFile(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8",
  );

  // Covers anything not prerendered (a mistyped slug): boots the app, which
  // renders its own not-found view.
  await writeFile(join(DIST, "404.html"), shell, "utf8");

  console.log(`\n  ${pages.length} routes prerendered, sitemap written`);
}

main().catch((error) => {
  console.error("prerender failed:", error.message);
  process.exit(1);
});
