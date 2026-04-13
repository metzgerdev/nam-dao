const API_BASE = "https://api.dropboxapi.com/2";
const CONTENT_BASE = "https://content.dropboxapi.com/2";

export const SAMPLES_PATH = "/DrumMachine/Samples";
export const PATTERNS_PATH = "/DrumMachine/Patterns";

const AUDIO_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".m4a",
  ".aif",
  ".aiff",
  ".ogg",
  ".flac",
]);

export interface DropboxFile {
  ".tag": "file" | "folder";
  id: string;
  name: string;
  path_lower: string;
}

function isAudioFile(entry: DropboxFile): boolean {
  if (entry[".tag"] !== "file") return false;
  const dot = entry.name.lastIndexOf(".");
  if (dot === -1) return false;
  return AUDIO_EXTENSIONS.has(entry.name.slice(dot).toLowerCase());
}

function isJsonFile(entry: DropboxFile): boolean {
  return entry[".tag"] === "file" && entry.name.endsWith(".json");
}

async function listFolder(
  token: string,
  path: string,
  recursive = false,
): Promise<DropboxFile[]> {
  const response = await fetch(`${API_BASE}/files/list_folder`, {
    body: JSON.stringify({ path, recursive }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to list Dropbox folder");

  const data = (await response.json()) as { entries: DropboxFile[] };
  return data.entries;
}

async function ensureFolder(token: string, path: string): Promise<void> {
  await fetch(`${API_BASE}/files/create_folder_v2`, {
    body: JSON.stringify({ path, autorename: false }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  // 409 means the folder already exists — both cases are success
}

export async function ensureAppFolders(token: string): Promise<void> {
  await Promise.all([
    ensureFolder(token, SAMPLES_PATH),
    ensureFolder(token, PATTERNS_PATH),
  ]);
}

export async function listAudioFiles(token: string): Promise<DropboxFile[]> {
  const entries = await listFolder(token, SAMPLES_PATH, true);
  return entries.filter(isAudioFile);
}

export async function listPatternFiles(token: string): Promise<DropboxFile[]> {
  const entries = await listFolder(token, PATTERNS_PATH, false);
  return entries.filter(isJsonFile);
}

export function patternPath(name: string): string {
  return `${PATTERNS_PATH}/${name}.json`;
}

export async function downloadFile(
  token: string,
  path: string,
): Promise<ArrayBuffer> {
  const response = await fetch(`${CONTENT_BASE}/files/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to download file");
  return response.arrayBuffer();
}

export async function uploadJson(
  token: string,
  path: string,
  data: unknown,
): Promise<void> {
  const response = await fetch(`${CONTENT_BASE}/files/upload`, {
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ mode: "overwrite", path }),
    },
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to upload pattern");
}

export async function downloadJson<T>(
  token: string,
  path: string,
): Promise<T> {
  const buffer = await downloadFile(token, path);
  return JSON.parse(new TextDecoder().decode(buffer)) as T;
}
