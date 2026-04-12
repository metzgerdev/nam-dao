import { useCallback, useEffect, useState } from "react";
import {
  clearOAuthParams,
  clearStoredToken,
  exchangeCodeForToken,
  getOAuthCode,
  getStoredToken,
  startDropboxAuth,
} from "../utils/dropboxAuth";
import {
  PATTERN_PATH,
  downloadFile,
  downloadJson,
  listAudioFiles,
  uploadJson,
  type DropboxFile,
} from "../utils/dropboxApi";

export type DropboxConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface UseDropboxReturn {
  connectionState: DropboxConnectionState;
  files: DropboxFile[];
  filesLoading: boolean;
  connect: () => void;
  disconnect: () => void;
  downloadAudio: (path: string) => Promise<ArrayBuffer>;
  savePattern: (data: unknown) => Promise<void>;
  loadPattern: <T>() => Promise<T>;
}

export function useDropbox(): UseDropboxReturn {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [connectionState, setConnectionState] = useState<DropboxConnectionState>(
    () => (getStoredToken() ? "connected" : "disconnected"),
  );
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // Handle OAuth redirect code exchange
  useEffect(() => {
    const code = getOAuthCode();
    if (!code) return;

    clearOAuthParams();
    setConnectionState("connecting");

    exchangeCodeForToken(code)
      .then((accessToken) => {
        setToken(accessToken);
        setConnectionState("connected");
      })
      .catch(() => {
        setConnectionState("error");
      });
  }, []);

  // Fetch audio file list when connected
  useEffect(() => {
    if (!token || connectionState !== "connected") return;

    setFilesLoading(true);
    listAudioFiles(token)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setFilesLoading(false));
  }, [token, connectionState]);

  const connect = useCallback(() => {
    void startDropboxAuth();
  }, []);

  const disconnect = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setFiles([]);
    setConnectionState("disconnected");
  }, []);

  const downloadAudio = useCallback(
    async (path: string): Promise<ArrayBuffer> => {
      if (!token) throw new Error("Not connected to Dropbox");
      return downloadFile(token, path);
    },
    [token],
  );

  const savePattern = useCallback(
    async (data: unknown): Promise<void> => {
      if (!token) throw new Error("Not connected to Dropbox");
      return uploadJson(token, PATTERN_PATH, data);
    },
    [token],
  );

  const loadPattern = useCallback(async <T>(): Promise<T> => {
    if (!token) throw new Error("Not connected to Dropbox");
    return downloadJson<T>(token, PATTERN_PATH);
  }, [token]);

  return {
    connectionState,
    connect,
    disconnect,
    downloadAudio,
    files,
    filesLoading,
    loadPattern,
    savePattern,
  };
}
