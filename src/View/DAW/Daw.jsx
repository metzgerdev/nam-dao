import { useEffect, useState } from "react";
import { useStepSequencer } from "../../hooks/useStepSequencer";

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

function buildWaveformPath(audioBuffer, pointCount = 28) {
  if (!audioBuffer || typeof audioBuffer.getChannelData !== "function") {
    return "";
  }

  const channelData = audioBuffer.getChannelData(0);
  if (!channelData?.length) {
    return "";
  }

  const bucketSize = Math.max(1, Math.floor(channelData.length / pointCount));
  const topPoints = [];
  const bottomPoints = [];

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const start = pointIndex * bucketSize;
    const end = Math.min(channelData.length, start + bucketSize);
    let peak = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(channelData[sampleIndex]));
    }

    const x = (pointIndex / Math.max(1, pointCount - 1)) * 100;
    const amplitude = Math.min(peak, 1) * 34;
    const topY = 50 - amplitude;
    const bottomY = 50 + amplitude;
    topPoints.push(`${pointIndex === 0 ? "M" : "L"} ${x.toFixed(2)} ${topY.toFixed(2)}`);
    bottomPoints.unshift(`L ${x.toFixed(2)} ${bottomY.toFixed(2)}`);
  }

  return `${topPoints.join(" ")} ${bottomPoints.join(" ")} Z`;
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
  audioBuffer,
  index,
  isCurrentStep,
  onToggleStep,
  steps,
  trackName,
}) {
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
              {isActive ? (
                <>
                  {waveformPath ? (
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
                </>
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

  function isCurrentStep(stepIndex) {
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
