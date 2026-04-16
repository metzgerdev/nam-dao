import {
  clearOAuthParams,
  clearStoredToken,
  exchangeCodeForToken,
  getOAuthCode,
  getOAuthState,
  getStoredToken,
  hasDropboxAppKey,
} from "./dropboxAuth";

// hasDropboxAppKey reads the module-level CLIENT_ID which is evaluated at
// import time from import.meta.env.VITE_DROPBOX_APP_KEY. Bun auto-loads .env
// when running tests, so the value depends on whether .env is present locally.
// We just verify the function returns a boolean.

describe("hasDropboxAppKey", () => {
  test("returns a boolean", () => {
    expect(typeof hasDropboxAppKey()).toBe("boolean");
  });
});

describe("getStoredToken / clearStoredToken", () => {
  afterEach(() => {
    // Reset in-memory token state between tests
    clearStoredToken();
    sessionStorage.clear();
  });

  test("getStoredToken returns null when nothing is stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  test("clearStoredToken is a no-op when no token is stored", () => {
    expect(() => clearStoredToken()).not.toThrow();
    expect(getStoredToken()).toBeNull();
  });
});

describe("getOAuthCode", () => {
  afterEach(() => {
    // Reset the URL back to a clean state after each test
    window.history.replaceState({}, "", "/");
  });

  test("returns null when there is no code query param", () => {
    window.history.replaceState({}, "", "/");
    expect(getOAuthCode()).toBeNull();
  });

  test("returns the code when present in the query string", () => {
    window.history.replaceState({}, "", "/?code=auth_code_xyz");
    expect(getOAuthCode()).toBe("auth_code_xyz");
  });

  test("returns null when a different query param is present", () => {
    window.history.replaceState({}, "", "/?state=abc");
    expect(getOAuthCode()).toBeNull();
  });

  test("returns the code when it appears alongside other params", () => {
    window.history.replaceState({}, "", "/?state=abc&code=mycode&foo=bar");
    expect(getOAuthCode()).toBe("mycode");
  });
});

describe("getOAuthState", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("returns null when there is no state query param", () => {
    window.history.replaceState({}, "", "/");
    expect(getOAuthState()).toBeNull();
  });

  test("returns the state when present in the query string", () => {
    window.history.replaceState({}, "", "/?state=csrf_token_xyz");
    expect(getOAuthState()).toBe("csrf_token_xyz");
  });

  test("returns null when only code param is present", () => {
    window.history.replaceState({}, "", "/?code=abc");
    expect(getOAuthState()).toBeNull();
  });

  test("returns the state when it appears alongside other params", () => {
    window.history.replaceState({}, "", "/?code=abc&state=mystate&foo=bar");
    expect(getOAuthState()).toBe("mystate");
  });
});

describe("clearOAuthParams", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("removes the query string from the current URL", () => {
    window.history.replaceState({}, "", "/?code=auth_code_xyz&state=abc");
    clearOAuthParams();
    expect(window.location.search).toBe("");
  });

  test("preserves the pathname", () => {
    window.history.replaceState({}, "", "/sequencer?code=xyz");
    clearOAuthParams();
    expect(window.location.pathname).toBe("/sequencer");
    expect(window.location.search).toBe("");
  });

  test("is a no-op when there is no query string", () => {
    window.history.replaceState({}, "", "/");
    clearOAuthParams();
    expect(window.location.search).toBe("");
  });
});

describe("exchangeCodeForToken — state validation", () => {
  let originalFetch: typeof global.fetch;
  beforeAll(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    clearStoredToken();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  test("throws when no stored state exists", async () => {
    sessionStorage.setItem("dropbox_code_verifier", "verifier");
    // No STATE_KEY in sessionStorage
    await expect(
      exchangeCodeForToken("code", "some_state"),
    ).rejects.toThrow("OAuth state mismatch");
  });

  test("throws when received state does not match stored state", async () => {
    sessionStorage.setItem("dropbox_code_verifier", "verifier");
    sessionStorage.setItem("dropbox_oauth_state", "expected_state");
    await expect(
      exchangeCodeForToken("code", "wrong_state"),
    ).rejects.toThrow("OAuth state mismatch");
  });

  test("throws when received state is null", async () => {
    sessionStorage.setItem("dropbox_code_verifier", "verifier");
    sessionStorage.setItem("dropbox_oauth_state", "expected_state");
    await expect(
      exchangeCodeForToken("code", null),
    ).rejects.toThrow("OAuth state mismatch");
  });
});
