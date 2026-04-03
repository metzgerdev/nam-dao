import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import FeedbackCard from "./components/FeedbackCard";
import LibrarySidebar from "./components/LibrarySidebar";
import MeterStrip from "./components/MeterStrip";
import OverviewCard from "./components/OverviewCard";
import PlaybackDeck from "./components/PlaybackDeck";
import type { MeterReadout } from "./components/types";
import {
  fetchMusicLibrary,
  type MusicTrack,
  type MusicLibrary,
} from "./mockMusicPlayerApi";
import {
  computeRms,
  IDLE_METER_LEVEL,
  METER_FFT_SIZE,
  normalizeMeterLevel,
  smoothMeterLevel,
} from "./vuMeterUtils";

function formatPlaybackTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function loadTrackDuration(track: MusicTrack): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();

    function cleanup() {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("error", handleError);
    }

    function resolveDuration() {
      const nextDuration =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      cleanup();
      resolve(nextDuration);
    }

    function handleLoadedMetadata() {
      resolveDuration();
    }

    function handleDurationChange() {
      resolveDuration();
    }

    function handleError() {
      cleanup();
      resolve(0);
    }

    audio.preload = "metadata";
    audio.src = track.audio.src;
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("error", handleError);
    audio.load();
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const DEFAULT_VOLUME = 0.72;

function angleToVolume(angle: number): number {
  const knobMinAngle = -135;
  const knobMaxAngle = 135;

  return clamp(
    (clamp(angle, knobMinAngle, knobMaxAngle) - knobMinAngle) /
      (knobMaxAngle - knobMinAngle),
    0,
    1,
  );
}

function volumeFromPointerPosition(
  clientX: number,
  clientY: number,
  element: HTMLElement,
): number {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle =
    (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI + 90;

  return angleToVolume(angle);
}

function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const channelSplitterRef = useRef<ChannelSplitterNode | null>(null);
  const channelMergerRef = useRef<ChannelMergerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const leftAnalyserRef = useRef<AnalyserNode | null>(null);
  const rightAnalyserRef = useRef<AnalyserNode | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pendingAutoplayRef = useRef(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [library, setLibrary] = useState<MusicLibrary | null>(null);
  const [trackDurations, setTrackDurations] = useState<Record<string, number>>({});
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [meterLevels, setMeterLevels] = useState({
    left: IDLE_METER_LEVEL,
    right: IDLE_METER_LEVEL,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLibrary() {
      try {
        const nextLibrary = await fetchMusicLibrary();

        if (!isMounted) {
          return;
        }

        setLibrary(nextLibrary);
        setActiveTrackId(
          nextLibrary.featuredTrackId ?? nextLibrary.tracks[0]?.id ?? null,
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The mock GraphQL backend could not load the session.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTrack =
    library?.tracks.find((track) => track.id === activeTrackId) ?? null;
  const activeTrackIndex = library?.tracks.findIndex(
    (track) => track.id === activeTrackId,
  );
  const fallbackDuration = activeTrack ? (trackDurations[activeTrack.id] ?? 0) : 0;
  const effectiveDuration = duration > 0 ? duration : fallbackDuration;
  const meterReadouts: MeterReadout[] = [
    {
      id: "left",
      label: "L",
      level: meterLevels.left,
    },
    {
      id: "right",
      label: "R",
      level: meterLevels.right,
    },
  ];

  useEffect(() => {
    if (!library?.tracks.length) {
      setTrackDurations({});
      return;
    }

    let isMounted = true;

    async function loadDurations() {
      const nextEntries = await Promise.all(
        library.tracks.map(async (track) => {
          const nextDuration = await loadTrackDuration(track);
          return [track.id, nextDuration] as const;
        }),
      );

      if (!isMounted) {
        return;
      }

      setTrackDurations(Object.fromEntries(nextEntries));
    }

    void loadDurations();

    return () => {
      isMounted = false;
    };
  }, [library]);

  useEffect(() => {
    return () => {
      leftAnalyserRef.current?.disconnect();
      rightAnalyserRef.current?.disconnect();
      channelSplitterRef.current?.disconnect();
      channelMergerRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      audioSourceNodeRef.current?.disconnect();
      leftAnalyserRef.current = null;
      rightAnalyserRef.current = null;
      channelSplitterRef.current = null;
      channelMergerRef.current = null;
      gainNodeRef.current = null;
      audioSourceNodeRef.current = null;

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      void audioContext?.close();
    };
  }, []);

  useEffect(() => {
    const analyserSize = leftAnalyserRef.current?.fftSize ?? METER_FFT_SIZE;
    const leftBuffer = new Float32Array(analyserSize);
    const rightBuffer = new Float32Array(
      rightAnalyserRef.current?.fftSize ?? analyserSize,
    );
    let animationFrameId = 0;
    let previousTimestamp: number | null = null;

    function updateMeters(timestamp: number) {
      const leftAnalyser = leftAnalyserRef.current;
      const rightAnalyser = rightAnalyserRef.current;
      const deltaTimeMs =
        previousTimestamp === null ? 16.67 : timestamp - previousTimestamp;
      previousTimestamp = timestamp;
      let nextLeftLevel = IDLE_METER_LEVEL;
      let nextRightLevel = IDLE_METER_LEVEL;

      if (isPlaying && leftAnalyser) {
        leftAnalyser.getFloatTimeDomainData(leftBuffer);
        if (rightAnalyser) {
          rightAnalyser.getFloatTimeDomainData(rightBuffer);
        } else {
          rightBuffer.set(leftBuffer);
        }

        nextLeftLevel = normalizeMeterLevel(computeRms(leftBuffer));
        const rawRightLevel = normalizeMeterLevel(computeRms(rightBuffer));
        nextRightLevel =
          rawRightLevel <= IDLE_METER_LEVEL + 0.01 &&
          nextLeftLevel > IDLE_METER_LEVEL + 0.03
            ? nextLeftLevel
            : rawRightLevel;
      }

      let shouldContinue = isPlaying;

      setMeterLevels((previousLevels) => {
        const left = smoothMeterLevel(
          previousLevels.left,
          nextLeftLevel,
          deltaTimeMs,
        );
        const right = smoothMeterLevel(
          previousLevels.right,
          nextRightLevel,
          deltaTimeMs,
        );

        if (
          Math.abs(left - previousLevels.left) < 0.001 &&
          Math.abs(right - previousLevels.right) < 0.001
        ) {
          shouldContinue =
            shouldContinue ||
            Math.abs(previousLevels.left - IDLE_METER_LEVEL) > 0.001 ||
            Math.abs(previousLevels.right - IDLE_METER_LEVEL) > 0.001;
          return previousLevels;
        }

        shouldContinue =
          shouldContinue ||
          Math.abs(left - IDLE_METER_LEVEL) > 0.001 ||
          Math.abs(right - IDLE_METER_LEVEL) > 0.001;
        return { left, right };
      });

      if (shouldContinue) {
        animationFrameId = requestAnimationFrame(updateMeters);
      }
    }

    animationFrameId = requestAnimationFrame(updateMeters);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  const ensureAudioAnalysisGraph = useCallback(
    (audio: HTMLAudioElement): AudioContext | null => {
      if (audioContextRef.current && audioSourceNodeRef.current) {
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = volume;
        }
        audio.volume = 1;
        return audioContextRef.current;
      }

      const AudioContextConstructor =
        window.AudioContext ??
        (
          window as Window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextConstructor) {
        return null;
      }

      try {
        const context = new AudioContextConstructor();
        const sourceNode = context.createMediaElementSource(audio);
        const splitter = context.createChannelSplitter(2);
        const merger = context.createChannelMerger(2);
        const gainNode = context.createGain();
        const leftAnalyser = context.createAnalyser();
        const rightAnalyser = context.createAnalyser();

        leftAnalyser.fftSize = METER_FFT_SIZE;
        rightAnalyser.fftSize = METER_FFT_SIZE;
        leftAnalyser.smoothingTimeConstant = 0.78;
        rightAnalyser.smoothingTimeConstant = 0.78;

        sourceNode.connect(splitter);
        splitter.connect(leftAnalyser, 0);
        splitter.connect(rightAnalyser, 1);
        leftAnalyser.connect(merger, 0, 0);
        rightAnalyser.connect(merger, 0, 1);
        merger.connect(gainNode);
        gainNode.gain.value = volume;
        gainNode.connect(context.destination);
        audio.volume = 1;

        audioContextRef.current = context;
        audioSourceNodeRef.current = sourceNode;
        channelSplitterRef.current = splitter;
        channelMergerRef.current = merger;
        gainNodeRef.current = gainNode;
        leftAnalyserRef.current = leftAnalyser;
        rightAnalyserRef.current = rightAnalyser;

        return context;
      } catch {
        return null;
      }
    },
    [volume],
  );

  const beginPlayback = useCallback(
    async (audio: HTMLAudioElement): Promise<void> => {
      const audioContext = ensureAudioAnalysisGraph(audio);

      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }

      await audio.play();
    },
    [ensureAudioAnalysisGraph],
  );

  const syncTransportState = useCallback((audio: HTMLAudioElement) => {
    setCurrentTime(audio.currentTime);
    setDuration(
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : 0,
    );
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeTrack) {
      return;
    }

    setCurrentTime(0);
    setDuration(0);
    setErrorMessage(null);
    setMeterLevels({
      left: IDLE_METER_LEVEL,
      right: IDLE_METER_LEVEL,
    });
    audio.currentTime = 0;
    audio.load();
    syncTransportState(audio);

    if (pendingAutoplayRef.current) {
      pendingAutoplayRef.current = false;
      void beginPlayback(audio).then(
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          setErrorMessage(
            "Playback is blocked until the browser allows audio for this page.",
          );
        },
      );
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, [activeTrack, beginPlayback, syncTransportState]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !isPlaying) {
      return undefined;
    }

    let animationFrameId = 0;

    function syncPlaybackPosition() {
      syncTransportState(audio);
      animationFrameId = requestAnimationFrame(syncPlaybackPosition);
    }

    animationFrameId = requestAnimationFrame(syncPlaybackPosition);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, syncTransportState]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }

    if (audioRef.current) {
      audioRef.current.volume = gainNodeRef.current ? 1 : volume;
    }
  }, [volume]);

  function selectTrack(trackId: string) {
    pendingAutoplayRef.current = isPlaying;
    setActiveTrackId(trackId);
  }

  function selectAdjacentTrack(direction: -1 | 1) {
    if (!library?.tracks.length) {
      return;
    }

    const currentIndex =
      typeof activeTrackIndex === "number" && activeTrackIndex >= 0
        ? activeTrackIndex
        : 0;
    const nextIndex =
      (currentIndex + direction + library.tracks.length) % library.tracks.length;

    pendingAutoplayRef.current = isPlaying;
    setActiveTrackId(library.tracks[nextIndex]?.id ?? null);
  }

  function handlePlaybackToggle() {
    const audio = audioRef.current;

    if (!audio || !activeTrack) {
      return;
    }

    if (isPlaying) {
      pendingAutoplayRef.current = false;
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void beginPlayback(audio).then(
      () => {
        setErrorMessage(null);
        setIsPlaying(true);
      },
      () => {
        setIsPlaying(false);
        setErrorMessage(
          "Playback is blocked until the browser allows audio for this page.",
        );
      },
    );
  }

  function handleSeekChange(event: ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    const nextTime = Number(event.currentTarget.value);

    setCurrentTime(nextTime);

    if (audio) {
      audio.currentTime = nextTime;
    }
  }

  function handleTrackEnded() {
    if (!library?.tracks.length) {
      setIsPlaying(false);
      return;
    }

    const nextIndex =
      typeof activeTrackIndex === "number" && activeTrackIndex >= 0
        ? (activeTrackIndex + 1) % library.tracks.length
        : 0;

    pendingAutoplayRef.current = true;
    setActiveTrackId(library.tracks[nextIndex]?.id ?? null);
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    setVolume(Number(event.currentTarget.value));
  }

  function handleVolumePointerDown(event: PointerEvent<HTMLDivElement>) {
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setVolume(
      volumeFromPointerPosition(
        event.clientX,
        event.clientY,
        event.currentTarget,
      ),
    );
  }

  function handleVolumePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    setVolume(
      volumeFromPointerPosition(
        event.clientX,
        event.clientY,
        event.currentTarget,
      ),
    );
  }

  function handleVolumePointerRelease(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleVolumeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setVolume((previousVolume) => clamp(previousVolume - 0.02, 0, 1));
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setVolume((previousVolume) => clamp(previousVolume + 0.02, 0, 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setVolume(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setVolume(1);
    }
  }

  const [leftMeter, rightMeter] = meterReadouts;

  return (
    <main className="music-player">
      <section className="music-player-shell">
        <div className="music-player-stage">
          <MeterStrip
            leftMeter={leftMeter ?? null}
            onVolumeChange={handleVolumeChange}
            onVolumeKeyDown={handleVolumeKeyDown}
            onVolumePointerDown={handleVolumePointerDown}
            onVolumePointerMove={handleVolumePointerMove}
            onVolumePointerRelease={handleVolumePointerRelease}
            rightMeter={rightMeter ?? null}
            volume={volume}
          />

          {isLoading ? (
            <FeedbackCard
              kicker="Booting"
              live
              summary="Pulling artwork and WAV sources from the local session assets."
              title="Loading music library…"
            />
          ) : errorMessage && !library ? (
            <FeedbackCard
              kicker="Backend Error"
              summary={errorMessage}
              title="Session unavailable."
            />
          ) : activeTrack ? (
            <section className="music-player-console">
              <div className="music-player-main-panel">
                <OverviewCard track={activeTrack} />

                <section className="music-player-deck">
                  <PlaybackDeck
                    currentTime={currentTime}
                    currentTimeLabel={formatPlaybackTime(currentTime)}
                    durationLabel={
                      effectiveDuration > 0
                        ? formatPlaybackTime(effectiveDuration)
                        : "…"
                    }
                    errorMessage={errorMessage}
                    isPlaying={isPlaying}
                    maxDuration={effectiveDuration}
                    onNextTrack={() => selectAdjacentTrack(1)}
                    onPreviousTrack={() => selectAdjacentTrack(-1)}
                    onSeekChange={handleSeekChange}
                    onTogglePlayback={handlePlaybackToggle}
                    totalTimeLabel={
                      effectiveDuration > 0
                        ? formatPlaybackTime(effectiveDuration)
                        : "…"
                    }
                  />
                </section>
              </div>

              <LibrarySidebar
                activeTrackId={activeTrackId}
                onSelectTrack={selectTrack}
                trackDurations={trackDurations}
                tracks={library?.tracks ?? []}
              />

              <audio
                onCanPlay={(event) => syncTransportState(event.currentTarget)}
                onDurationChange={(event) => {
                  syncTransportState(event.currentTarget);
                }}
                onEnded={handleTrackEnded}
                onError={() => {
                  setIsPlaying(false);
                  setErrorMessage("This audio file could not be played.");
                }}
                onLoadedData={(event) => syncTransportState(event.currentTarget)}
                onLoadedMetadata={(event) =>
                  syncTransportState(event.currentTarget)
                }
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onSeeked={(event) => syncTransportState(event.currentTarget)}
                onSeeking={(event) => syncTransportState(event.currentTarget)}
                onTimeUpdate={(event) => syncTransportState(event.currentTarget)}
                preload="metadata"
                ref={audioRef}
                src={activeTrack.audio.src}
              />
            </section>
          ) : (
            <FeedbackCard
              kicker="Library"
              summary="Add music files to the player data folder and expose them through the mock GraphQL library."
              title="No tracks available."
            />
          )}
        </div>
      </section>
    </main>
  );
}

export default MusicPlayer;
