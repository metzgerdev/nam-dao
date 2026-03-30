interface ServiceWorkerContainerLike {
  register: (scriptURL: string) => Promise<unknown>;
}

interface NavigatorLike {
  serviceWorker?: ServiceWorkerContainerLike;
}

interface LocationLike {
  hash?: string;
  href: string;
  hostname: string;
}

interface RegisterAssetCacheOptions {
  enableOnLocalhost?: boolean;
  location?: LocationLike;
  navigator?: NavigatorLike;
}

const LOCALHOST_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

export function createAssetCacheUrl(href: string): string {
  const serviceWorkerUrl = new URL("./asset-cache-sw.js", href);
  serviceWorkerUrl.hash = "";
  return serviceWorkerUrl.toString();
}

export async function registerAssetCache(
  options: RegisterAssetCacheOptions = {},
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const locationLike = options.location ?? window.location;
  const navigatorLike = options.navigator ?? window.navigator;
  const serviceWorker = navigatorLike.serviceWorker;
  const isLocalhost = LOCALHOST_HOSTNAMES.has(locationLike.hostname);

  if (!serviceWorker || (isLocalhost && !options.enableOnLocalhost)) {
    return;
  }

  try {
    await serviceWorker.register(createAssetCacheUrl(locationLike.href));
  } catch {
    // Ignore service worker registration failures so the app still boots.
  }
}
