import { useEffect, useState, type RefObject } from "react";
import type { AudioBufferMap, InstrumentName } from "../../data/instruments";
import { useStepSequencer } from "../../hooks/useStepSequencer";
import {
  buildWaveformPath,
  formatTrackIndex,
  formatTrackName,
  TRACK_TINTS,
} from "./dawHelpers";

interface DawTrackProps {
  activeSteps: Set<number>;
  audioBuffer: AudioBufferMap[InstrumentName];
  index: number;
  isCurrentStep: (stepIndex: number) => boolean;
  onToggleStep: (trackName: InstrumentName, stepIndex: number) => void;
  steps: boolean[];
  trackName: InstrumentName;
}

function useUiStep(
  currentStepRef: RefObject<number>,
  isPlaying: boolean,
): number {
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
  audioBuffer,
  index,
  isCurrentStep,
  onToggleStep,
  steps,
  trackName,
}: DawTrackProps) {
  const accentClassName = TRACK_TINTS[trackName] ?? "daw-step-cell--primary";
  const waveformPath = buildWaveformPath(audioBuffer);

  return (
    <article className="daw-track">
      <header className="daw-track-header">
        <div className="daw-track-index">{formatTrackIndex(index)}</div>
        <div className="daw-track-copy">
          <h2>{formatTrackName(trackName)}</h2>
        </div>
      </header>
      <div
        className="daw-track-grid"
        role="grid"
        aria-label={`${trackName} arrangement`}
      >
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
              {isActive && waveformPath ? (
                <svg
                  aria-hidden="true"
                  className="daw-clip-waveform"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line
                    className="daw-clip-waveform-guide"
                    x1="0"
                    x2="100"
                    y1="50"
                    y2="50"
                  />
                  <path className="daw-clip-waveform-fill" d={waveformPath} />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function Daw() {
  const {
    audioBuffers,
    currentStepRef,
    drumState,
    handleTempoChange,
    instrumentRows,
    isPlaying,
    samplesLoaded,
    stepCount,
    steps,
    tempo,
    togglePlayback,
    toggleStep,
  } = useStepSequencer();
  const uiStep = useUiStep(currentStepRef, isPlaying);

  function isCurrentStep(stepIndex: number): boolean {
    return uiStep === stepIndex;
  }

  return (
    <main className="daw">
      <section className="daw-shell">
        <header className="daw-topbar">
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
                onChange={handleTempoChange}
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

        <section
          className="daw-arrangement"
          aria-label="Digital audio workstation arrangement"
        >
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
                audioBuffer={samplesLoaded ? audioBuffers[trackName] : null}
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
