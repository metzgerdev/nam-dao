import {
  downloadFile,
  downloadJson,
  listAudioFiles,
  listPatternFiles,
  patternPath,
  PATTERNS_PATH,
  SAMPLES_PATH,
  uploadJson,
} from "./dropboxApi";
import type { DropboxFile } from "./dropboxApi";

const TOKEN = "test_token";

// Save and restore global.fetch so mutations don't leak into other test files
let originalFetch: typeof global.fetch;
beforeAll(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

function makeFetch(body: unknown, ok = true) {
  return jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode(JSON.stringify(body)).buffer),
    }),
  );
}

function makeEntry(
  tag: "file" | "folder",
  name: string,
  path_lower: string,
): DropboxFile {
  return { ".tag": tag, id: path_lower, name, path_lower };
}

afterEach(() => {
  jest.restoreAllMocks();
});

// ── patternPath ──────────────────────────────────────────────────────────────

describe("patternPath", () => {
  test("returns a path under PATTERNS_PATH with .json extension", () => {
    expect(patternPath("my pattern")).toBe(
      `${PATTERNS_PATH}/my pattern.json`,
    );
  });

  test("does not double-add .json", () => {
    expect(patternPath("beat")).toBe(`${PATTERNS_PATH}/beat.json`);
  });
});

// ── listAudioFiles ────────────────────────────────────────────────────────────

describe("listAudioFiles", () => {
  test("sends a POST to the list_folder endpoint with SAMPLES_PATH and recursive=true", async () => {
    const mockFetch = makeFetch({ entries: [] });
    global.fetch = mockFetch;

    await listAudioFiles(TOKEN);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.dropboxapi.com/2/files/list_folder");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    });
    const body = JSON.parse(init.body as string) as { path: string; recursive: boolean };
    expect(body.path).toBe(SAMPLES_PATH);
    expect(body.recursive).toBe(true);
  });

  test("returns only file entries with recognised audio extensions", async () => {
    const entries = [
      makeEntry("file", "kick.wav", "/drumachine/samples/kick.wav"),
      makeEntry("file", "snare.mp3", "/drumachine/samples/snare.mp3"),
      makeEntry("file", "beat.m4a", "/drumachine/samples/beat.m4a"),
      makeEntry("file", "notes.txt", "/drumachine/samples/notes.txt"),
      makeEntry("folder", "subfolder", "/drumachine/samples/subfolder"),
      makeEntry("file", "loop.flac", "/drumachine/samples/loop.flac"),
      makeEntry("file", "pad.ogg", "/drumachine/samples/pad.ogg"),
      makeEntry("file", "hit.aif", "/drumachine/samples/hit.aif"),
      makeEntry("file", "hit2.aiff", "/drumachine/samples/hit2.aiff"),
    ];
    global.fetch = makeFetch({ entries });

    const result = await listAudioFiles(TOKEN);

    expect(result.map((f) => f.name)).toEqual([
      "kick.wav",
      "snare.mp3",
      "beat.m4a",
      "loop.flac",
      "pad.ogg",
      "hit.aif",
      "hit2.aiff",
    ]);
  });

  test("returns an empty array when the folder is empty", async () => {
    global.fetch = makeFetch({ entries: [] });
    expect(await listAudioFiles(TOKEN)).toEqual([]);
  });

  test("extension matching is case-insensitive", async () => {
    const entries = [
      makeEntry("file", "KICK.WAV", "/s/kick.wav"),
      makeEntry("file", "snare.MP3", "/s/snare.mp3"),
    ];
    global.fetch = makeFetch({ entries });
    const result = await listAudioFiles(TOKEN);
    expect(result).toHaveLength(2);
  });

  test("throws when the API response is not ok", async () => {
    global.fetch = makeFetch({}, false);
    await expect(listAudioFiles(TOKEN)).rejects.toThrow();
  });
});

// ── listPatternFiles ──────────────────────────────────────────────────────────

describe("listPatternFiles", () => {
  test("sends a POST to list_folder with PATTERNS_PATH and recursive=false", async () => {
    const mockFetch = makeFetch({ entries: [] });
    global.fetch = mockFetch;

    await listPatternFiles(TOKEN);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { path: string; recursive: boolean };
    expect(body.path).toBe(PATTERNS_PATH);
    expect(body.recursive).toBe(false);
  });

  test("returns only .json file entries", async () => {
    const entries = [
      makeEntry("file", "beat1.json", "/p/beat1.json"),
      makeEntry("file", "beat2.json", "/p/beat2.json"),
      makeEntry("file", "notes.txt", "/p/notes.txt"),
      makeEntry("folder", "archive", "/p/archive"),
    ];
    global.fetch = makeFetch({ entries });

    const result = await listPatternFiles(TOKEN);
    expect(result.map((f) => f.name)).toEqual(["beat1.json", "beat2.json"]);
  });

  test("returns an empty array when no patterns exist", async () => {
    global.fetch = makeFetch({ entries: [] });
    expect(await listPatternFiles(TOKEN)).toEqual([]);
  });
});

// ── downloadFile ──────────────────────────────────────────────────────────────

describe("downloadFile", () => {
  test("sends a POST to the content download endpoint with correct headers", async () => {
    const mockFetch = makeFetch(null);
    global.fetch = mockFetch;

    const path = "/DrumMachine/Samples/kick.wav";
    await downloadFile(TOKEN, path);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://content.dropboxapi.com/2/files/download",
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    });
  });

  test("returns an ArrayBuffer", async () => {
    const buffer = new ArrayBuffer(16);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(buffer),
      }),
    );

    const result = await downloadFile(TOKEN, "/some/path");
    expect(result).toBe(buffer);
  });

  test("throws when the response is not ok", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
    );
    await expect(downloadFile(TOKEN, "/bad")).rejects.toThrow(
      "Failed to download file",
    );
  });
});

// ── uploadJson ────────────────────────────────────────────────────────────────

describe("uploadJson", () => {
  test("sends a POST to the upload endpoint with overwrite mode", async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({ ok: true }),
    );
    global.fetch = mockFetch;

    const data = { tempo: 120, instruments: {} };
    const path = "/DrumMachine/Patterns/beat.json";
    await uploadJson(TOKEN, path, data);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://content.dropboxapi.com/2/files/upload");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ mode: "overwrite", path }),
    });
    expect(init.body).toBe(JSON.stringify(data));
  });

  test("throws when the response is not ok", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    await expect(
      uploadJson(TOKEN, "/p/beat.json", {}),
    ).rejects.toThrow("Failed to upload pattern");
  });
});

// ── downloadJson ──────────────────────────────────────────────────────────────

describe("downloadJson", () => {
  test("decodes the ArrayBuffer as JSON and returns the typed value", async () => {
    const payload = { version: 1, tempo: 130, instruments: {} };
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(encoded.buffer),
      }),
    );

    const result = await downloadJson<typeof payload>(TOKEN, "/p/beat.json");
    expect(result).toEqual(payload);
  });
});
