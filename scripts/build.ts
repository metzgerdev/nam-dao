import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

interface PackageJson {
  homepage?: string;
}

interface BuildAppOptions {
  production: boolean;
}

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const TEMPLATE_PATH = path.join(ROOT_DIR, "index.html");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");

function normalizeBasePath(homepage: string | undefined, production: boolean): string {
  if (!production || !homepage) {
    return "/";
  }

  const { pathname } = new URL(homepage);
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function toPublicUrl(basePath: string, relativePath: string): string {
  return new URL(relativePath, `https://placeholder${basePath}`).pathname;
}

function formatBuildLogs(logs: Bun.BuildOutput["logs"]): string {
  return logs
    .map((log) => {
      if ("message" in log) {
        return log.message;
      }

      return `${log.name}: ${log.message}`;
    })
    .join("\n");
}

function injectAssets({
  template,
  scriptUrl,
  styleUrls,
}: {
  template: string;
  scriptUrl: string;
  styleUrls: string[];
}): string {
  const stylesheetTags = styleUrls
    .map((href) => `    <link rel="stylesheet" href="${href}" />`)
    .join("\n");

  const withStyles = stylesheetTags.length > 0
    ? template.replace("</head>", `${stylesheetTags}\n  </head>`)
    : template;

  return withStyles.replace(
    "</body>",
    `    <script type="module" src="${scriptUrl}"></script>\n  </body>`,
  );
}

async function copyPublicAssets(): Promise<void> {
  try {
    await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function buildApp({ production }: BuildAppOptions): Promise<void> {
  const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, "utf8")) as PackageJson;
  const basePath = normalizeBasePath(packageJson.homepage, production);

  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  const build = await Bun.build({
    entrypoints: ["./src/index.tsx"],
    outdir: DIST_DIR,
    target: "browser",
    format: "esm",
    splitting: true,
    publicPath: basePath,
    sourcemap: production ? "none" : "linked",
    minify: production,
    naming: {
      entry: "assets/[name]-[hash].[ext]",
      chunk: "assets/[name]-[hash].[ext]",
      asset: "assets/[name]-[hash].[ext]",
    },
  });

  if (!build.success) {
    throw new Error(formatBuildLogs(build.logs));
  }

  await copyPublicAssets();

  const scriptOutput = build.outputs.find(
    (output) => output.kind === "entry-point" && output.path.endsWith(".js"),
  );
  const styleOutputs = build.outputs.filter((output) => output.path.endsWith(".css"));

  if (!scriptOutput) {
    throw new Error("Bun did not emit a browser entry script.");
  }

  const relativeScriptPath = path.relative(DIST_DIR, scriptOutput.path).split(path.sep).join("/");
  const relativeStylePaths = styleOutputs.map((output) =>
    path.relative(DIST_DIR, output.path).split(path.sep).join("/"),
  );
  const template = await readFile(TEMPLATE_PATH, "utf8");
  const html = injectAssets({
    template,
    scriptUrl: toPublicUrl(basePath, relativeScriptPath),
    styleUrls: relativeStylePaths.map((stylePath) => toPublicUrl(basePath, stylePath)),
  });

  await writeFile(path.join(DIST_DIR, "index.html"), html);

  console.log(
    production
      ? `Built production bundle at ${scriptOutput.path}`
      : `Built development bundle at ${scriptOutput.path}`,
  );
}

if (import.meta.main) {
  const production = process.argv.includes("--production") || Bun.env.NODE_ENV === "production";
  await buildApp({ production });
}
