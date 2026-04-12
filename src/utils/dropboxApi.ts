const API_BASE = "https://api.dropboxapi.com/2";
const CONTENT_BASE = "https://content.dropboxapi.com/2";

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

export async function listAudioFiles(
  token: string,
  path = "",
): Promise<DropboxFile[]> {
  const response = await fetch(`${API_BASE}/files/list_folder`, {
    body: JSON.stringify({ path, recursive: true }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to list Dropbox files");

  const data = (await response.json()) as { entries: DropboxFile[] };
  return data.entries.filter(isAudioFile);
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

export const PATTERN_PATH = "/DrumMachine/current-pattern.json";

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
