import {
  createAssetCacheUrl,
  registerAssetCache,
} from "./registerAssetCache";

describe("registerAssetCache", () => {
  it("builds the service worker url from the current route", () => {
    expect(createAssetCacheUrl("https://example.com/#/daw")).toBe(
      "https://example.com/asset-cache-sw.js",
    );

    expect(
      createAssetCacheUrl("https://example.com/Drum-Machine/#/too-fast-too-furious"),
    ).toBe("https://example.com/Drum-Machine/asset-cache-sw.js");
  });

  it("registers the asset cache service worker off localhost", async () => {
    const register = jest.fn().mockResolvedValue(undefined);

    await registerAssetCache({
      location: {
        href: "https://example.com/#/home",
        hostname: "example.com",
      },
      navigator: {
        serviceWorker: { register },
      },
    });

    expect(register).toHaveBeenCalledWith(
      "https://example.com/asset-cache-sw.js",
    );
  });

  it("skips registration on localhost by default", async () => {
    const register = jest.fn().mockResolvedValue(undefined);

    await registerAssetCache({
      location: {
        href: "http://localhost:8080/#/home",
        hostname: "localhost",
      },
      navigator: {
        serviceWorker: { register },
      },
    });

    expect(register).not.toHaveBeenCalled();
  });
});
