import { useState } from "react";
import { hasDropboxAppKey } from "../../utils/dropboxAuth";
import { useDropbox } from "../../hooks/useDropbox";
import type { DropboxFile } from "../../utils/dropboxApi";
import type { TrackLabel } from "../../data/instruments";
import type { SerializedPattern } from "../../hooks/useStepSequencer";

interface DropboxPanelProps {
  instrumentRows: readonly TrackLabel[];
  isDirty: boolean;
  loadSampleForInstrument: (
    track: TrackLabel,
    buffer: ArrayBuffer,
  ) => Promise<void>;
  markSaved: () => void;
  patternName: string;
  restorePattern: (data: SerializedPattern) => void;
  serializePattern: () => SerializedPattern;
  setPatternName: (name: string) => void;
  setSampleName: (track: TrackLabel, name: string) => void;
}

type AssignStatus = "idle" | "loading" | "done" | "error";
type PatternStatus = "idle" | "saving" | "saved" | "loading" | "loaded" | "error";

function fileBaseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function PatternNameRow({
  patternName,
  setPatternName,
  isDirty,
}: {
  patternName: string;
  setPatternName: (name: string) => void;
  isDirty: boolean;
}) {
  return (
    <div className="dropbox-pattern-name-row">
      <input
        className="dropbox-pattern-name-input"
        type="text"
        value={patternName}
        onChange={(e) => setPatternName(e.target.value)}
        aria-label="Pattern name"
        spellCheck={false}
      />
      {isDirty && (
        <span className="pattern-dirty-dot" aria-label="Unsaved changes" />
      )}
    </div>
  );
}

function DropboxPanel({
  instrumentRows,
  isDirty,
  loadSampleForInstrument,
  markSaved,
  patternName,
  restorePattern,
  serializePattern,
  setPatternName,
  setSampleName,
}: DropboxPanelProps) {
  const {
    connectionState,
    connect,
    disconnect,
    downloadAudio,
    files,
    filesLoading,
    patternFiles,
    patternFilesLoading,
    savePattern,
    loadPattern,
  } = useDropbox();

  const [selectedFile, setSelectedFile] = useState<DropboxFile | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<DropboxFile | null>(null);
  const [assignStatus, setAssignStatus] = useState<
    Partial<Record<TrackLabel, AssignStatus>>
  >({});
  const [patternStatus, setPatternStatus] = useState<PatternStatus>("idle");

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  async function handleAssign(track: TrackLabel) {
    if (!selectedFile) return;
    setAssignStatus((prev) => ({ ...prev, [track]: "loading" }));
    try {
      const buffer = await downloadAudio(selectedFile.path_lower);
      await loadSampleForInstrument(track, buffer);
      setSampleName(track, fileBaseName(selectedFile.name));
      setAssignStatus((prev) => ({ ...prev, [track]: "done" }));
      setTimeout(() => {
        setAssignStatus((prev) => ({ ...prev, [track]: "idle" }));
      }, 1500);
    } catch {
      setAssignStatus((prev) => ({ ...prev, [track]: "error" }));
    }
  }

  async function handleSavePattern() {
    setPatternStatus("saving");
    try {
      await savePattern(serializePattern(), patternName);
      markSaved();
      setPatternStatus("saved");
      setTimeout(() => setPatternStatus("idle"), 2000);
    } catch {
      setPatternStatus("error");
      setTimeout(() => setPatternStatus("idle"), 2000);
    }
  }

  async function handleLoadPattern() {
    if (!selectedPattern) return;
    setPatternStatus("loading");
    try {
      const data = await loadPattern<SerializedPattern>(selectedPattern.path_lower);
      restorePattern(data);
      setPatternStatus("loaded");
      setTimeout(() => setPatternStatus("idle"), 2000);
    } catch {
      setPatternStatus("error");
      setTimeout(() => setPatternStatus("idle"), 2000);
    }
  }

  if (!hasDropboxAppKey()) {
    return (
      <section className="dropbox-panel" aria-label="Dropbox Studio">
        <header className="dropbox-panel-header">
          <span className="dropbox-panel-title">Dropbox Studio</span>
        </header>
        <div className="dropbox-panel-nokey">
          <PatternNameRow
            patternName={patternName}
            setPatternName={setPatternName}
            isDirty={isDirty}
          />
          <p className="dropbox-no-key">Dropbox integration is not enabled.</p>
        </div>
      </section>
    );
  }

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
        <div className="dropbox-disconnected">
          <PatternNameRow
            patternName={patternName}
            setPatternName={setPatternName}
            isDirty={isDirty}
          />
          <p className="dropbox-connect-copy">
            Connect to browse your Dropbox for samples and save patterns to the
            cloud.
          </p>
        </div>
      )}

      {isConnected && (
        <div className="dropbox-panel-body">
          {/* ── Samples ── */}
          <div className="dropbox-library">
            <p className="dropbox-section-label">Samples</p>
            {filesLoading ? (
              <p className="dropbox-empty">Scanning…</p>
            ) : files.length === 0 ? (
              <p className="dropbox-empty">No audio files in /DrumMachine/Samples.</p>
            ) : (
              <ul className="dropbox-file-list" role="listbox" aria-label="Audio files">
                {files.map((file) => (
                  <li
                    key={file.id}
                    role="option"
                    aria-selected={selectedFile?.id === file.id}
                    className={`dropbox-file-item${selectedFile?.id === file.id ? " selected" : ""}`}
                    onClick={() =>
                      setSelectedFile(selectedFile?.id === file.id ? null : file)
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
                {instrumentRows.map((track) => {
                  const status = assignStatus[track] ?? "idle";
                  return (
                    <button
                      key={track}
                      type="button"
                      className={`dropbox-assign-btn${status === "loading" ? " loading" : ""}${status === "done" ? " done" : ""}`}
                      onClick={() => void handleAssign(track)}
                      disabled={status === "loading"}
                      title={`Load ${selectedFile.name} as ${track}`}
                    >
                      {status === "done" ? "✓" : status === "loading" ? "…" : track}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Patterns ── */}
          <div className="dropbox-patterns">
            <PatternNameRow
              patternName={patternName}
              setPatternName={setPatternName}
              isDirty={isDirty}
            />
            <p className="dropbox-section-label">Patterns</p>
            {patternFilesLoading ? (
              <p className="dropbox-empty">Scanning…</p>
            ) : patternFiles.length === 0 ? (
              <p className="dropbox-empty">No patterns saved yet.</p>
            ) : (
              <ul className="dropbox-file-list" role="listbox" aria-label="Saved patterns">
                {patternFiles.map((file) => (
                  <li
                    key={file.id}
                    role="option"
                    aria-selected={selectedPattern?.id === file.id}
                    className={`dropbox-file-item${selectedPattern?.id === file.id ? " selected" : ""}`}
                    onClick={() =>
                      setSelectedPattern(
                        selectedPattern?.id === file.id ? null : file,
                      )
                    }
                  >
                    {fileBaseName(file.name)}
                  </li>
                ))}
              </ul>
            )}

            <div className="dropbox-pattern-actions">
              <button
                type="button"
                className="dropbox-btn dropbox-btn-secondary"
                onClick={() => void handleSavePattern()}
                disabled={
                  patternStatus === "saving" ||
                  patternStatus === "loading" ||
                  !patternName.trim()
                }
              >
                {patternStatus === "saving" ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="dropbox-btn dropbox-btn-secondary"
                onClick={() => void handleLoadPattern()}
                disabled={
                  patternStatus === "saving" ||
                  patternStatus === "loading" ||
                  !selectedPattern
                }
              >
                {patternStatus === "loading" ? "Loading…" : "Load"}
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
        </div>
      )}
    </section>
  );
}

export default DropboxPanel;
