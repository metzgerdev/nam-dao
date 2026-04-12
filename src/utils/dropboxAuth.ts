const CLIENT_ID = import.meta.env.VITE_DROPBOX_APP_KEY as string | undefined;
const AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const TOKEN_URL = "https://api.dropbox.com/oauth2/token";
const TOKEN_KEY = "dropbox_access_token";
const VERIFIER_KEY = "dropbox_code_verifier";

export function hasDropboxAppKey(): boolean {
  return Boolean(CLIENT_ID);
}

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function startDropboxAuth(): Promise<void> {
  if (!CLIENT_ID) return;

  const verifier = generateRandomString(64);
  const challenge = base64urlEncode(await sha256(verifier));

  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    token_access_type: "offline",
  });

  window.location.href = `${AUTH_URL}?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!CLIENT_ID) throw new Error("No app key configured");

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("No code verifier found");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
  });

  const response = await fetch(TOKEN_URL, {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) throw new Error("Token exchange failed");

  const data = (await response.json()) as { access_token: string };
  sessionStorage.setItem(TOKEN_KEY, data.access_token);
  sessionStorage.removeItem(VERIFIER_KEY);

  return data.access_token;
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getOAuthCode(): string | null {
  return new URLSearchParams(window.location.search).get("code");
}

export function clearOAuthParams(): void {
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", url.toString());
}
