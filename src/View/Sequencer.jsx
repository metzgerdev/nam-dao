import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";
import { instrumentRows, instruments } from "../data/instruments";
import { initDrumMachine } from "../utils/sampleLoader";
import {
  handleBPM,
  handlePatternChange,
  handleStart,
  stopPlayback,
  triggerSample,
  updateActiveStep,
  scheduler,
} from "../utils/playback";

function Sequencer() {
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD_SECONDS = 0.1;
  const [tempo, setTempo] = useState(123);
  const secondsPerStep = 60 / tempo / 4;
  const stepCount = 16;
  const steps = new Array(stepCount).fill(false);
  const [drumState, setDrumState] = useState(instruments);
  const [isPlaying, setIsPlaying] = useState(false);
  const drumStateRef = useRef(instruments);
  const audioContextRef = useRef(null);
  const nextNoteTime = useRef(0);
  const currentStep = useRef(0);
  const sequencerClockId = useRef(null);
  const audioBufferRefs = useRef(
    instrumentRows.reduce((acc, curr) => {
      acc[curr] = null;
      return acc;
    }, {}),
  );

  useEffect(() => {
    initDrumMachine({ audioContextRef, audioBufferRefs, drumStateRef });
  }, []);

  useEffect(() => {
    drumStateRef.current = drumState;
  }, [drumState]);

  useEffect(() => {
    if (isPlaying) {
      scheduler({
        audioContextRef,
        nextNoteTime,
        currentStep,
        secondsPerStep,
        stepCount,
        sequencerClockId,
        LOOKAHEAD_MS,
        SCHEDULE_AHEAD_SECONDS,
        triggerSampleFn: (stepRef, time) =>
          triggerSample(
            { drumStateRef, audioBufferRefs, audioContextRef },
            stepRef,
            time,
          ),
      });
    }

    return () => {
      clearTimeout(sequencerClockId.current);
      sequencerClockId.current = null;
    };
  }, [isPlaying, secondsPerStep]);

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
              onInput={(e) => handleBPM(e, setTempo)}
              name="bpm"
              id="bpm"
              type="range"
              min="60"
              max="200"
              value={tempo}
              step="5"
            />
          </div>
          <button
            type="button"
            className="transport-toggle"
            onClick={() =>
              handleStart({
                audioContextRef,
                isPlaying,
                setIsPlaying,
                secondsPerStep,
                nextNoteTime,
                stopPlayback: () => stopPlayback(audioContextRef),
              })
            }
          >
            {isPlaying ? "Stop" : "Start"}
          </button>
        </section>

        <section className="tr909-grid">
          <ProgressBar
            steps={steps}
            currentStepRef={currentStep}
            isPlaying={isPlaying}
          />
          {instrumentRows.map((type) => (
            <div className="row-block" key={type}>
              <span className="row-name">{type}</span>
              <div
                className="sequencer-row"
                onClick={(e) => handlePatternChange(e, type, setDrumState)}
              >
                {steps.map((value, index) => (
                  <button
                    type="button"
                    className={updateActiveStep(index, type, drumState)}
                    value={index}
                    key={`${type}-${index}`}
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
