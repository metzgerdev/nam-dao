import { renderHook, act } from "@testing-library/react";

// ── Mock dropboxAuth ─────────────────────────────────────────────────────────
// The real module has `const CLIENT_ID = import.meta.env.VITE_DROPBOX_APP_KEY`
// evaluated at import time. In the Bun test environment Vite doesn't run, so
// that constant is always undefined, causing exchangeCodeForToken to throw
// immediately. We replace the entire module with controlled stubs.

const mockGetStoredToken = jest.fn<string | null, []>(() => null);
const mockExchangeCodeForToken = jest.fn<Promise<string>, [string]>();
const mockGetOAuthCode = jest.fn<string | null, []>(() => null);
const mockClearOAuthParams = jest.fn();
const mockClearStoredToken = jest.fn();
const mockStartDropboxAuth = jest.fn();

jest.mock("../utils/dropboxAuth", () => ({
  clearOAuthParams: () => mockClearOAuthParams(),
  clearStoredToken: () => mockClearStoredToken(),
  exchangeCodeForToken: (code: string) => mockExchangeCodeForToken(code),
  getOAuthCode: () => mockGetOAuthCode(),
  getStoredToken: () => mockGetStoredToken(),
  hasDropboxAppKey: () => true,
  startDropboxAuth: () => mockStartDropboxAuth(),
}));

// ── Mock dropboxApi ──────────────────────────────────────────────────────────

const mockListAudioFiles = jest.fn<Promise<[]>, [string]>(() => Promise.resolve([]));
const mockListPatternFiles = jest.fn<Promise<[]>, [string]>(() => Promise.resolve([]));
const mockUploadJson = jest.fn<Promise<void>, [string, string, unknown]>(() => Promise.resolve());
const mockDownloadJson = jest.fn();
const mockDownloadFile = jest.fn();
const mockEnsureAppFolders = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

jest.mock("../utils/dropboxApi", () => ({
  downloadFile: (...args: unknown[]) => mockDownloadFile(...args),
  downloadJson: (...args: unknown[]) => mockDownloadJson(...args),
  ensureAppFolders: (token: string) => mockEnsureAppFolders(token),
  listAudioFiles: (token: string) => mockListAudioFiles(token),
  listPatternFiles: (token: string) => mockListPatternFiles(token),
  patternPath: (name: string) => `/DrumMachine/Patterns/${name}.json`,
  uploadJson: (...args: unknown[]) => mockUploadJson(...args),
}));

// ── Import hook after mocks are in place ─────────────────────────────────────

import { useDropbox } from "./useDropbox";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDropbox() {
  return renderHook(() => useDropbox());
}

beforeEach(() => {
  jest.clearAllMocks();
  // Defaults: not connected, no OAuth code in URL
  mockGetStoredToken.mockReturnValue(null);
  mockGetOAuthCode.mockReturnValue(null);
  mockListAudioFiles.mockResolvedValue([]);
  mockListPatternFiles.mockResolvedValue([]);
  mockEnsureAppFolders.mockResolvedValue(undefined);
});

afterEach(() => {
  // Reset all mock implementations so stale return values don't leak into
  // other test files sharing the same Bun worker
  jest.resetAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  test("starts disconnected when no token is stored", () => {
    const { result } = renderDropbox();
    expect(result.current.connectionState).toBe("disconnected");
    expect(result.current.files).toEqual([]);
    expect(result.current.patternFiles).toEqual([]);
  });

  test("starts connected when a token is already in storage", async () => {
    mockGetStoredToken.mockReturnValue("saved_token");

    const { result } = renderDropbox();

    // Allow the file-listing effects to settle
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.connectionState).toBe("connected");
  });
});

// ── OAuth redirect handling ───────────────────────────────────────────────────

describe("OAuth redirect handling", () => {
  test("exchanges the code on mount and transitions to connected", async () => {
    mockGetOAuthCode.mockReturnValue("auth_code_123");
    mockExchangeCodeForToken.mockResolvedValue("new_access_token");

    const { result } = renderDropbox();

    // After mount the effect fires
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockClearOAuthParams).toHaveBeenCalled();
    expect(mockExchangeCodeForToken).toHaveBeenCalledWith("auth_code_123");
    expect(result.current.connectionState).toBe("connected");
  });

  test("transitions to error state when token exchange fails", async () => {
    mockGetOAuthCode.mockReturnValue("bad_code");
    mockExchangeCodeForToken.mockRejectedValue(new Error("exchange failed"));

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.connectionState).toBe("error");
  });
});

// ── connect / disconnect ──────────────────────────────────────────────────────

describe("connect", () => {
  test("calls startDropboxAuth", () => {
    const { result } = renderDropbox();
    act(() => {
      result.current.connect();
    });
    expect(mockStartDropboxAuth).toHaveBeenCalledTimes(1);
  });
});

describe("disconnect", () => {
  test("clears the token, resets files, and goes back to disconnected", async () => {
    mockGetStoredToken.mockReturnValue("tok");

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.connectionState).toBe("connected");

    act(() => {
      result.current.disconnect();
    });

    expect(mockClearStoredToken).toHaveBeenCalled();
    expect(result.current.connectionState).toBe("disconnected");
    expect(result.current.files).toEqual([]);
    expect(result.current.patternFiles).toEqual([]);
  });
});

// ── file listing on connect ───────────────────────────────────────────────────

describe("file listing", () => {
  test("fetches audio and pattern files when connected", async () => {
    const audioFiles = [{ ".tag": "file" as const, id: "1", name: "kick.wav", path_lower: "/s/kick.wav" }];
    const patternFiles = [{ ".tag": "file" as const, id: "2", name: "beat.json", path_lower: "/p/beat.json" }];

    mockGetStoredToken.mockReturnValue("tok");
    mockListAudioFiles.mockResolvedValue(audioFiles as never);
    mockListPatternFiles.mockResolvedValue(patternFiles as never);

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockListAudioFiles).toHaveBeenCalledWith("tok");
    expect(mockListPatternFiles).toHaveBeenCalledWith("tok");
    expect(result.current.files).toEqual(audioFiles);
    expect(result.current.patternFiles).toEqual(patternFiles);
  });

  test("sets files to [] when listing throws", async () => {
    mockGetStoredToken.mockReturnValue("tok");
    mockListAudioFiles.mockRejectedValue(new Error("network error"));
    mockListPatternFiles.mockRejectedValue(new Error("network error"));

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.files).toEqual([]);
    expect(result.current.patternFiles).toEqual([]);
  });
});

// ── downloadAudio ─────────────────────────────────────────────────────────────

describe("downloadAudio", () => {
  test("throws when not connected", async () => {
    const { result } = renderDropbox();
    await expect(
      result.current.downloadAudio("/some/path"),
    ).rejects.toThrow("Not connected to Dropbox");
  });

  test("delegates to downloadFile when connected", async () => {
    const buffer = new ArrayBuffer(8);
    mockGetStoredToken.mockReturnValue("tok");
    mockDownloadFile.mockResolvedValue(buffer);

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
    });

    const received = await result.current.downloadAudio("/s/kick.wav");
    expect(mockDownloadFile).toHaveBeenCalledWith("tok", "/s/kick.wav");
    expect(received).toBe(buffer);
  });
});

// ── savePattern ───────────────────────────────────────────────────────────────

describe("savePattern", () => {
  test("throws when not connected", async () => {
    const { result } = renderDropbox();
    await expect(
      result.current.savePattern({ version: 1 }, "beat"),
    ).rejects.toThrow("Not connected to Dropbox");
  });

  test("uploads the pattern and refreshes the pattern list", async () => {
    mockGetStoredToken.mockReturnValue("tok");
    mockUploadJson.mockResolvedValue(undefined);

    const updatedPatterns = [
      { ".tag": "file" as const, id: "1", name: "beat.json", path_lower: "/p/beat.json" },
    ];
    // First call returns [] (initial load), second call returns the new file
    mockListPatternFiles
      .mockResolvedValueOnce([])
      .mockResolvedValue(updatedPatterns as never);

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
    });

    const data = { version: 1, tempo: 120 };
    await act(async () => {
      await result.current.savePattern(data, "beat");
    });

    expect(mockUploadJson).toHaveBeenCalledWith(
      "tok",
      "/DrumMachine/Patterns/beat.json",
      data,
    );
    // Pattern list should have been refreshed
    expect(mockListPatternFiles).toHaveBeenCalledTimes(2);
  });
});

// ── loadPattern ───────────────────────────────────────────────────────────────

describe("loadPattern", () => {
  test("throws when not connected", async () => {
    const { result } = renderDropbox();
    await expect(
      result.current.loadPattern("/p/beat.json"),
    ).rejects.toThrow("Not connected to Dropbox");
  });

  test("delegates to downloadJson and returns parsed data", async () => {
    const patternData = { version: 1, tempo: 130 };
    mockGetStoredToken.mockReturnValue("tok");
    mockDownloadJson.mockResolvedValue(patternData);

    const { result } = renderDropbox();

    await act(async () => {
      await Promise.resolve();
    });

    const received = await result.current.loadPattern<typeof patternData>(
      "/p/beat.json",
    );

    expect(mockDownloadJson).toHaveBeenCalledWith("tok", "/p/beat.json");
    expect(received).toEqual(patternData);
  });
});
