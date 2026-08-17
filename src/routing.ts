/**
 * Path-based routing helpers.
 *
 * The site is served from a sub-path on GitHub Pages ("/nam-dao/"), so every
 * in-app href has to carry that prefix and every parse has to strip it. Both
 * live here so the rest of the app can deal in bare route paths like
 * "work/midi-gpt".
 */

// Vite injects BASE_URL; the fallback keeps this usable under the test runner.
const BASE: string = import.meta.env?.BASE_URL ?? "/";

function trim(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

/**
 * Absolute href for a bare route path. hrefFor("work") -> "/nam-dao/work/"
 *
 * The trailing slash is deliberate: prerendered routes are directory index
 * files, so a static host 301s "/work" to "/work/". Emitting the slash skips
 * that redirect and keeps hrefs identical to the canonical URLs.
 */
export function hrefFor(path: string): string {
  const clean = trim(path);
  return clean ? `${BASE}${clean}/` : BASE;
}

/** The bare route path for the current URL: "", "work", "work/midi-gpt". */
export function currentPath(): string {
  let pathname = window.location.pathname;
  if (pathname.startsWith(BASE)) {
    pathname = pathname.slice(BASE.length);
  }
  return trim(pathname);
}

/**
 * Rewrite a legacy "#/work/midi-gpt" URL to "/nam-dao/work/midi-gpt" in place.
 * The site used hash routing until path routing landed, so links already shared
 * — the GitHub profile, anything pasted into a message — still arrive with a
 * fragment. Returns true if it changed the URL.
 */
export function migrateLegacyHash(): boolean {
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) {
    return false;
  }

  const target = hrefFor(hash.slice(2));
  window.history.replaceState(null, "", target);
  return true;
}

/**
 * True when a click on an anchor should be handled as an in-app navigation
 * rather than handed to the browser.
 */
export function isInternalNavigation(
  anchor: HTMLAnchorElement,
  event: MouseEvent,
): boolean {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }

  return url.pathname.startsWith(BASE);
}
