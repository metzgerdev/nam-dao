import ProgressBar from "./ProgressBar";
import DropboxPanel from "./DropboxPanel";
import { updateActiveStep } from "../../utils/playback";
import { useStepSequencer } from "../../hooks/useStepSequencer";

function Sequencer() {
  const {
    currentStepRef,
    drumState,
    handleTempoChange,
    instrumentRows,
    isDirty,
    isPlaying,
    loadSampleForInstrument,
    markSaved,
    patternName,
    restorePattern,
    sampleNames,
    serializePattern,
    setPatternName,
    setSampleName,
    steps,
    tempo,
    togglePlayback,
    toggleStep,
  } = useStepSequencer();

  return (
    <main className="tr909" aria-label="Sequencer">
      <section className="tr909-shell">
        <header className="tr909-header">
          <h1>
            <span className="brand-accent">Foland</span> TR-909
          </h1>
          <p>Rhythm Composer</p>
        </header>

        <section className="tr909-controls">
          <div className="tempo-group">
            <label htmlFor="bpm">{`Tempo ${tempo} BPM`}</label>
            <input
              onChange={handleTempoChange}
              name="bpm"
              id="bpm"
              type="range"
              min="60"
              max="200"
              value={tempo}
              step="1"
            />
          </div>
          <button
            type="button"
            className="transport-toggle"
            onClick={togglePlayback}
          >
            {isPlaying ? "Stop" : "Start"}
          </button>
        </section>

        <section className="tr909-grid">
          <ProgressBar
            steps={steps}
            currentStepRef={currentStepRef}
            isPlaying={isPlaying}
          />
          {instrumentRows.map((track) => (
            <div className="row-block" key={track}>
              <div className="row-label">
                <span className="row-name">{track}</span>
                <span className="row-tooltip">{sampleNames[track]}</span>
              </div>
              <div className="sequencer-row">
                {steps.map((_value, index) => (
                  <button
                    type="button"
                    className={updateActiveStep(index, track, drumState)}
                    value={index}
                    key={`${track}-${index}`}
                    onClick={() => toggleStep(track, index)}
                  ></button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <DropboxPanel
          instrumentRows={instrumentRows}
          isDirty={isDirty}
          loadSampleForInstrument={loadSampleForInstrument}
          markSaved={markSaved}
          patternName={patternName}
          restorePattern={restorePattern}
          serializePattern={serializePattern}
          setPatternName={setPatternName}
          setSampleName={setSampleName}
        />
      </section>
    </main>
  );
}

export default Sequencer;
