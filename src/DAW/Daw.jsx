import { useEffect, useState } from "react";
import { useStepSequencer } from "../hooks/useStepSequencer";

const TRACK_TINTS = {
  arp1: "daw-step-cell--secondary",
  bass: "daw-step-cell--secondary",
  closedHat: "daw-step-cell--cool",
  kick: "daw-step-cell--primary",
  openHat: "daw-step-cell--cool",
  piano: "daw-step-cell--secondary",
  ride: "daw-step-cell--cool",
  snare: "daw-step-cell--primary",
  vocal1: "daw-step-cell--secondary",
  vocal2: "daw-step-cell--secondary",
};

function formatTrackName(trackName) {
  return trackName.replace(/([A-Z])/g, " $1").trim().toUpperCase();
}

function formatTrackIndex(index) {
  return String(index + 1).padStart(2, "0");
}

function formatClipCount(activeStepCount) {
  return `${activeStepCount} ${activeStepCount === 1 ? "clip" : "clips"}`;
}

function useUiStep(currentStepRef, isPlaying) {
  const [uiStep, setUiStep] = useState(currentStepRef.current ?? 0);

  useEffect(() => {
    setUiStep(currentStepRef.current ?? 0);
  }, [currentStepRef]);

  useEffect(() => {
    function syncStep() {
      const nextStep = currentStepRef.current ?? 0;
      setUiStep((previousStep) => {
        return previousStep === nextStep ? previousStep : nextStep;
      });
      animationFrameId = requestAnimationFrame(syncStep);
    }

    if (!isPlaying) {
      setUiStep(currentStepRef.current ?? 0);
      return undefined;
    }

    let animationFrameId = requestAnimationFrame(syncStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentStepRef, isPlaying]);

  return uiStep;
}

function DawTrack({
  activeSteps,
  index,
  isCurrentStep,
  onToggleStep,
  steps,
  trackName,
}) {
  const accentClassName = TRACK_TINTS[trackName] ?? "daw-step-cell--primary";

  return (
    <article className="daw-track">
      <header className="daw-track-header">
        <div className="daw-track-index">{formatTrackIndex(index)}</div>
        <div className="daw-track-copy">
          <h2>{formatTrackName(trackName)}</h2>
          <p>{formatClipCount(activeSteps.size)}</p>
        </div>
      </header>
      <div className="daw-track-grid" role="grid" aria-label={`${trackName} arrangement`}>
        {steps.map((_value, stepIndex) => {
          const isActive = activeSteps.has(stepIndex);
          const className = [
            "daw-step-cell",
            isActive ? "active" : "",
            isActive ? accentClassName : "",
            isCurrentStep(stepIndex) ? "current" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              aria-label={`${trackName} step ${stepIndex + 1}`}
              className={className}
              key={`${trackName}-${stepIndex}`}
              onClick={() => onToggleStep(trackName, stepIndex)}
              type="button"
            >
              {isActive ? <span className="daw-clip-label">clip</span> : null}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function Daw() {
  const {
    currentStepRef,
    drumState,
    handleTempoChange,
    instrumentRows,
    isPlaying,
    stepCount,
    steps,
    tempo,
    togglePlayback,
    toggleStep,
  } = useStepSequencer();
  const uiStep = useUiStep(currentStepRef, isPlaying);

  function isCurrentStep(stepIndex) {
    return uiStep === stepIndex;
  }

  return (
    <main className="daw">
      <section className="daw-shell">
        <header className="daw-topbar">
          <div className="daw-heading">
            <p>Studio Heirloom</p>
            <h1>Arrangement View</h1>
          </div>
          <div className="daw-transport">
            <button
              className="daw-transport-button"
              onClick={togglePlayback}
              type="button"
            >
              {isPlaying ? "Stop" : "Start"}
            </button>
            <label className="daw-tempo" htmlFor="daw-bpm">
              <span>BPM</span>
              <strong>{tempo}</strong>
              <input
                id="daw-bpm"
                max="200"
                min="60"
                onInput={handleTempoChange}
                step="1"
                type="range"
                value={tempo}
              />
            </label>
            <div className="daw-status">
              <span>Grid</span>
              <strong>1 Bar / {stepCount} Steps</strong>
            </div>
          </div>
        </header>

        <section className="daw-arrangement" aria-label="Digital audio workstation arrangement">
          <div className="daw-ruler">
            <div className="daw-ruler-spacer">Tracks</div>
            <div className="daw-ruler-grid" aria-hidden="true">
              {steps.map((_value, index) => (
                <div className="daw-ruler-step" key={`ruler-${index}`}>
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="daw-track-list">
            {instrumentRows.map((trackName, index) => (
              <DawTrack
                activeSteps={drumState[trackName].activeSteps}
                index={index}
                isCurrentStep={isCurrentStep}
                key={trackName}
                onToggleStep={toggleStep}
                steps={steps}
                trackName={trackName}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Daw;
