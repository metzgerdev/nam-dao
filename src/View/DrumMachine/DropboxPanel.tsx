import { useState } from "react";
import { hasDropboxAppKey } from "../../utils/dropboxAuth";
import { useDropbox } from "../../hooks/useDropbox";
import type { DropboxFile } from "../../utils/dropboxApi";
import type { InstrumentName } from "../../data/instruments";
import type { SerializedPattern } from "../../hooks/useStepSequencer";

interface DropboxPanelProps {
  instrumentRows: readonly InstrumentName[];
  loadSampleForInstrument: (
    instrument: InstrumentName,
    buffer: ArrayBuffer,
  ) => Promise<void>;
  markSaved: () => void;
  serializePattern: () => SerializedPattern;
  restorePattern: (data: SerializedPattern) => void;
  setSampleName: (instrument: InstrumentName, name: string) => void;
  trackLabels: Record<InstrumentName, string>;
}

type AssignStatus = "idle" | "loading" | "done" | "error";
type PatternStatus = "idle" | "saving" | "saved" | "loading" | "loaded" | "error";

function fileBaseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function DropboxPanel({
  instrumentRows,
  loadSampleForInstrument,
  markSaved,
  serializePattern,
  restorePattern,
  setSampleName,
  trackLabels,
}: DropboxPanelProps) {
  const {
    connectionState,
    connect,
    disconnect,
    downloadAudio,
    files,
    filesLoading,
    savePattern,
    loadPattern,
  } = useDropbox();

  const [selectedFile, setSelectedFile] = useState<DropboxFile | null>(null);
  const [assignStatus, setAssignStatus] = useState<
    Partial<Record<InstrumentName, AssignStatus>>
  >({});
  const [patternStatus, setPatternStatus] = useState<PatternStatus>("idle");

  if (!hasDropboxAppKey()) {
    return (
      <section className="dropbox-panel" aria-label="Dropbox Studio">
        <header className="dropbox-panel-header">
          <span className="dropbox-panel-title">Dropbox Studio</span>
        </header>
        <p className="dropbox-no-key">
          Dropbox integration is not enabled.
        </p>
      </section>
    );
  }

  async function handleAssign(instrument: InstrumentName) {
    if (!selectedFile) return;
    setAssignStatus((prev) => ({ ...prev, [instrument]: "loading" }));
    try {
      const buffer = await downloadAudio(selectedFile.path_lower);
      await loadSampleForInstrument(instrument, buffer);
      setSampleName(instrument, fileBaseName(selectedFile.name));
      setAssignStatus((prev) => ({ ...prev, [instrument]: "done" }));
      setTimeout(() => {
        setAssignStatus((prev) => ({ ...prev, [instrument]: "idle" }));
      }, 1500);
    } catch {
      setAssignStatus((prev) => ({ ...prev, [instrument]: "error" }));
    }
  }

  async function handleSavePattern() {
    setPatternStatus("saving");
    try {
      await savePattern(serializePattern());
      markSaved();
      setPatternStatus("saved");
      setTimeout(() => setPatternStatus("idle"), 2000);
    } catch {
      setPatternStatus("error");
      setTimeout(() => setPatternStatus("idle"), 2000);
    }
  }

  async function handleLoadPattern() {
    setPatternStatus("loading");
    try {
      const data = await loadPattern<SerializedPattern>();
      restorePattern(data);
      setPatternStatus("loaded");
      setTimeout(() => setPatternStatus("idle"), 2000);
    } catch {
      setPatternStatus("error");
      setTimeout(() => setPatternStatus("idle"), 2000);
    }
  }

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  return (
    <section className="dropbox-panel" aria-label="Dropbox Studio">
      <header className="dropbox-panel-header">
        <span className="dropbox-panel-title">Dropbox Studio</span>
        <span
          className={`dropbox-status-dot${isConnected ? " connected" : ""}`}
          aria-hidden="true"
        />
        {isConnected ? (
          <span className="dropbox-status-label">Connected</span>
        ) : isConnecting ? (
          <span className="dropbox-status-label">Connecting…</span>
        ) : null}
        {isConnected ? (
          <button
            type="button"
            className="dropbox-btn dropbox-btn-secondary"
            onClick={disconnect}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            className="dropbox-btn dropbox-btn-connect"
            onClick={connect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : "Connect Dropbox"}
          </button>
        )}
      </header>

      {!isConnected && !isConnecting && (
        <p className="dropbox-connect-copy">
          Connect to browse your Dropbox for samples and save patterns to the
          cloud.
        </p>
      )}

      {isConnected && (
        <div className="dropbox-panel-body">
          <div className="dropbox-library">
            <p className="dropbox-section-label">Sample Library</p>
            {filesLoading ? (
              <p className="dropbox-empty">Scanning Dropbox…</p>
            ) : files.length === 0 ? (
              <p className="dropbox-empty">No audio files found in Dropbox.</p>
            ) : (
              <ul className="dropbox-file-list" role="listbox" aria-label="Audio files">
                {files.map((file) => (
                  <li
                    key={file.id}
                    role="option"
                    aria-selected={selectedFile?.id === file.id}
                    className={`dropbox-file-item${selectedFile?.id === file.id ? " selected" : ""}`}
                    onClick={() =>
                      setSelectedFile(
                        selectedFile?.id === file.id ? null : file,
                      )
                    }
                  >
                    {file.name}
                  </li>
                ))}
              </ul>
            )}

            {selectedFile && (
              <div className="dropbox-assign-row">
                <span className="dropbox-assign-label">Assign to:</span>
                {instrumentRows.map((instrument) => {
                  const status = assignStatus[instrument] ?? "idle";
                  return (
                    <button
                      key={instrument}
                      type="button"
                      className={`dropbox-assign-btn${status === "loading" ? " loading" : ""}${status === "done" ? " done" : ""}`}
                      onClick={() => void handleAssign(instrument)}
                      disabled={status === "loading"}
                      title={`Load ${selectedFile.name} as ${trackLabels[instrument]}`}
                    >
                      {status === "done" ? "✓" : status === "loading" ? "…" : trackLabels[instrument]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dropbox-pattern-section">
            <p className="dropbox-section-label">Pattern Storage</p>
            <button
              type="button"
              className="dropbox-btn dropbox-btn-secondary"
              onClick={() => void handleSavePattern()}
              disabled={patternStatus === "saving" || patternStatus === "loading"}
            >
              {patternStatus === "saving" ? "Saving…" : "Save Pattern"}
            </button>
            <button
              type="button"
              className="dropbox-btn dropbox-btn-secondary"
              onClick={() => void handleLoadPattern()}
              disabled={patternStatus === "saving" || patternStatus === "loading"}
            >
              {patternStatus === "loading" ? "Loading…" : "Load Pattern"}
            </button>
            {(patternStatus === "saved" || patternStatus === "loaded") && (
              <span className="dropbox-feedback">
                {patternStatus === "saved" ? "Saved ✓" : "Loaded ✓"}
              </span>
            )}
            {patternStatus === "error" && (
              <span className="dropbox-feedback error">Failed</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default DropboxPanel;
