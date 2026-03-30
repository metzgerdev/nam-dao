import ProgressBar from "./ProgressBar";
import { updateActiveStep } from "../utils/playback";
import { useStepSequencer } from "../hooks/useStepSequencer";

function Sequencer() {
  const {
    currentStepRef,
    drumState,
    handleTempoChange,
    instrumentRows,
    isPlaying,
    steps,
    tempo,
    togglePlayback,
    toggleStep,
  } = useStepSequencer();

  return (
    <main className="tr909">
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
              onInput={handleTempoChange}
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
          {instrumentRows.map((type) => (
            <div className="row-block" key={type}>
              <span className="row-name">{type}</span>
              <div
                className="sequencer-row"
              >
                {steps.map((_value, index) => (
                  <button
                    type="button"
                    className={updateActiveStep(index, type, drumState)}
                    value={index}
                    key={`${type}-${index}`}
                    onClick={() => toggleStep(type, index)}
                  ></button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

export default Sequencer;
