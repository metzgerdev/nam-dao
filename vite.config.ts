import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

interface PackageJson {
  homepage?: string;
}

function getProductionBasePath(): string {
  const packageJson = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8"),
  ) as PackageJson;

  if (!packageJson.homepage) {
    return "/";
  }

  const { pathname } = new URL(packageJson.homepage);
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

const productionBasePath = getProductionBasePath();

export default defineConfig(({ command }) => ({
  base: command === "build" ? productionBasePath : "/",
  plugins: [react()],
}));
