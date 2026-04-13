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
  downloadFile,
  downloadJson,
  provisionDropboxFolders,
  listAudioFiles,
  listPatternFiles,
  patternPath,
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
  patternFiles: DropboxFile[];
  patternFilesLoading: boolean;
  connect: () => void;
  disconnect: () => void;
  downloadAudio: (path: string) => Promise<ArrayBuffer>;
  savePattern: (data: unknown, name: string) => Promise<void>;
  loadPattern: <T>(path: string) => Promise<T>;
}

export function useDropbox(): UseDropboxReturn {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [connectionState, setConnectionState] = useState<DropboxConnectionState>(
    () => (getStoredToken() ? "connected" : "disconnected"),
  );
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [patternFiles, setPatternFiles] = useState<DropboxFile[]>([]);
  const [patternFilesLoading, setPatternFilesLoading] = useState(false);

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

  // Ensure app folders exist then fetch file lists when connected
  useEffect(() => {
    if (!token || connectionState !== "connected") return;

    setFilesLoading(true);
    setPatternFilesLoading(true);

    provisionDropboxFolders(token)
      .catch(() => {})
      .then(() =>
        Promise.all([
          listAudioFiles(token)
            .then(setFiles)
            .catch(() => setFiles([]))
            .finally(() => setFilesLoading(false)),
          listPatternFiles(token)
            .then(setPatternFiles)
            .catch(() => setPatternFiles([]))
            .finally(() => setPatternFilesLoading(false)),
        ]),
      );
  }, [token, connectionState]);

  const connect = useCallback(() => {
    void startDropboxAuth();
  }, []);

  const disconnect = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setFiles([]);
    setPatternFiles([]);
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
    async (data: unknown, name: string): Promise<void> => {
      if (!token) throw new Error("Not connected to Dropbox");
      await uploadJson(token, patternPath(name), data);
      // Refresh the pattern list after saving
      listPatternFiles(token)
        .then(setPatternFiles)
        .catch(() => {});
    },
    [token],
  );

  const loadPattern = useCallback(
    async <T>(path: string): Promise<T> => {
      if (!token) throw new Error("Not connected to Dropbox");
      return downloadJson<T>(token, path);
    },
    [token],
  );

  return {
    connectionState,
    connect,
    disconnect,
    downloadAudio,
    files,
    filesLoading,
    loadPattern,
    patternFiles,
    patternFilesLoading,
    savePattern,
  };
}
