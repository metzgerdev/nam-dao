import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

const BASS = "bass";
const KICK = "kick";
const SNARE = "snare";
const CLOSEDHAT = "closedHat";
const OPENHAT = "openHat";
const RIDE = "ride";
const PIANO = "piano";
const ARP1 = "arp1";
const VOCAL1 = "vocal1";
const VOCAL2 = "vocal2";

const instrumentRows = [
  KICK,
  SNARE,
  OPENHAT,
  CLOSEDHAT,
  RIDE,
  BASS,
  PIANO,
  ARP1,
  VOCAL1,
  VOCAL2,
];

const instruments = {
  [KICK]: {
    activeSteps: new Set([0, 4, 8, 12]),
    path: "/drum machine 123 bpm kick.wav",
  },
  [SNARE]: {
    activeSteps: new Set([4, 12]),
    path: "/one shot snare.wav",
  },
  [BASS]: {
    activeSteps: new Set([0, 3, 6, 9, 12, 15]),
    path: "/drum machine 123 bpm bass.wav",
  },

  [OPENHAT]: {
    activeSteps: new Set([2, 6, 10, 14]),
    path: "/drum machine 123 bpm open.wav",
  },
  [CLOSEDHAT]: {
    activeSteps: new Set([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]),
    path: "/drum machine 123 bpm closed hat.wav",
  },
  [RIDE]: {
    activeSteps: new Set(),
    path: "/drum machine 123 bpm ride.wav",
  },
  [PIANO]: {
    activeSteps: new Set(),
    path: "/drum machine 123 bpm rev piano.wav",
  },
  [ARP1]: {
    activeSteps: new Set([0]),
    path: "/melody.wav",
  },
  [VOCAL1]: {
    activeSteps: new Set(),
    path: "/drum machine 123 bpm vocal 1.wav",
  },

  [VOCAL2]: {
    activeSteps: new Set(),
    path: "/drum machine 123 bpm vocal 2.wav",
  },
};

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

  async function initDrumMachine() {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      await loadSamples();
    }
  }

  async function loadSamples() {
    for (const [sampleType, buffer] of Object.entries(
      audioBufferRefs.current,
    )) {
      if (buffer) {
        return;
      }
      audioBufferRefs.current = {
        ...audioBufferRefs.current,
        [sampleType]: await fetchDecodeSample(
          drumStateRef.current[sampleType].path,
        ),
      };
    }
  }

  function nextNote() {
    nextNoteTime.current = nextNoteTime.current + secondsPerStep;
    currentStep.current = (currentStep.current + 1) % stepCount;
  }

  function handleBPM(e) {
    setTempo(parseInt(e.target.value));
  }

  const handleClick = (e, type) => {
    const stepNumber = Number(e.target.value);
    setDrumState((previousState) => {
      const nextState = structuredClone(previousState);
      const { activeSteps } = nextState[type];
      if (activeSteps.has(stepNumber)) {
        activeSteps.delete(stepNumber);
      } else {
        activeSteps.add(stepNumber);
      }
      return nextState;
    });
  };

  const handleStart = () => {
    const context = audioContextRef.current;
    if (!context) {
      return;
    }

    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }

    nextNoteTime.current = context.currentTime;
    if (context.state === "suspended") {
      context.resume();
    }
    setIsPlaying(true);
  };

  function stopPlayback() {
    if (audioContextRef.current) {
      audioContextRef.current.suspend();
    }
  }

  async function fetchDecodeSample(path) {
    const result = await fetch(path);
    const arrayBuffer = await result.arrayBuffer();
    return audioContextRef.current.decodeAudioData(arrayBuffer);
  }

  function triggerSample(currentStepRef, time) {
    for (const sampleType in drumStateRef.current) {
      const { activeSteps } = drumStateRef.current[sampleType];
      if (activeSteps.has(currentStepRef.current)) {
        const audioBuffer = audioBufferRefs.current[sampleType];
        const source = new AudioBufferSourceNode(audioContextRef.current);
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start(time);
      }
    }
  }

  function updateActiveStep(index, type) {
    let className = "step";
    const targetRow = drumState[type];
    if (targetRow.activeSteps.has(index)) {
      className = `${className} active`;
    }
    return className;
  }

  useEffect(() => {
    initDrumMachine();
  }, []);

  useEffect(() => {
    drumStateRef.current = drumState;
  }, [drumState]);

  useEffect(() => {
    function scheduler() {
      if (!audioContextRef.current) {
        return;
      }
      while (
        nextNoteTime.current <
        audioContextRef.current.currentTime + SCHEDULE_AHEAD_SECONDS
      ) {
        triggerSample(currentStep, nextNoteTime.current);
        nextNote();
      }
      sequencerClockId.current = setTimeout(scheduler, LOOKAHEAD_MS);
    }
    if (isPlaying) {
      scheduler();
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
              onInput={handleBPM}
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
            onClick={handleStart}
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
                onClick={(e) => handleClick(e, type)}
              >
                {steps.map((value, index) => (
                  <button
                    type="button"
                    className={updateActiveStep(index, type)}
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
