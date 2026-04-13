import {
  clearOAuthParams,
  clearStoredToken,
  getOAuthCode,
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
    sessionStorage.clear();
  });

  test("getStoredToken returns null when nothing is stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  test("getStoredToken returns the token after it has been stored", () => {
    sessionStorage.setItem("dropbox_access_token", "tok_abc123");
    expect(getStoredToken()).toBe("tok_abc123");
  });

  test("clearStoredToken removes the stored token", () => {
    sessionStorage.setItem("dropbox_access_token", "tok_abc123");
    clearStoredToken();
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
