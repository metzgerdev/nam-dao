import { useQueries, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
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
  createKWeightingFilterChain,
  hasMeterSettled,
  IDLE_METER_LEVEL,
  METER_FFT_SIZE,
  readMeterLevels,
  shouldKeepMeterAnimationActive,
  smoothMeterLevel,
} from "./vuMeterUtils";
import { usePlayback } from "./hooks/usePlayback";
import { useVolume } from "./hooks/useVolume";

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
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0;
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

function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const channelSplitterRef = useRef<ChannelSplitterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const leftAnalyserRef = useRef<AnalyserNode | null>(null);
  const meterFilterNodesRef = useRef<AudioNode[]>([]);
  const rightAnalyserRef = useRef<AnalyserNode | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [meterLevels, setMeterLevels] = useState({
    left: IDLE_METER_LEVEL,
    right: IDLE_METER_LEVEL,
  });
  const {
    handleVolumeChange,
    handleVolumeKeyDown,
    handleVolumePointerDown,
    handleVolumePointerMove,
    handleVolumePointerRelease,
    volume,
  } = useVolume();
  const resetMeterLevels = useCallback(() => {
    setMeterLevels({
      left: IDLE_METER_LEVEL,
      right: IDLE_METER_LEVEL,
    });
  }, []);
  const libraryQuery = useQuery({
    queryKey: ["music-player", "library"],
    queryFn: fetchMusicLibrary,
  });
  const library: MusicLibrary | null = libraryQuery.data ?? null;
  const libraryErrorMessage =
    libraryQuery.error instanceof Error
      ? libraryQuery.error.message
      : libraryQuery.error
        ? "The mock GraphQL backend could not load the session."
        : null;
  const isLoading = libraryQuery.isPending;

  const activeTrack =
    library?.tracks.find((track) => track.id === activeTrackId) ?? null;
  const activeTrackIndex = library?.tracks.findIndex(
    (track) => track.id === activeTrackId,
  );
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
      setActiveTrackId(null);
      return;
    }

    const activeTrackStillExists = library.tracks.some(
      (track) => track.id === activeTrackId,
    );

    if (!activeTrackStillExists) {
      setActiveTrackId(library.featuredTrackId ?? library.tracks[0]?.id ?? null);
    }
  }, [activeTrackId, library]);

  const trackDurationQueries = useQueries({
    queries: (library?.tracks ?? []).map((track) => ({
      queryKey: ["music-player", "track-duration", track.audio.src],
      queryFn: () => loadTrackDuration(track),
      staleTime: Infinity,
    })),
  });
  const trackDurations = Object.fromEntries(
    (library?.tracks ?? []).map((track, index) => [
      track.id,
      trackDurationQueries[index]?.data ?? 0,
    ]),
  );

  useEffect(() => {
    return () => {
      leftAnalyserRef.current?.disconnect();
      rightAnalyserRef.current?.disconnect();
      channelSplitterRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      audioSourceNodeRef.current?.disconnect();
      meterFilterNodesRef.current.forEach((node) => node.disconnect());
      leftAnalyserRef.current = null;
      rightAnalyserRef.current = null;
      channelSplitterRef.current = null;
      gainNodeRef.current = null;
      audioSourceNodeRef.current = null;
      meterFilterNodesRef.current = [];

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      void audioContext?.close();
    };
  }, []);

  const generateAudioAnalysisGraph = useCallback(
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
        const gainNode = context.createGain();
        const leftAnalyser = context.createAnalyser();
        const rightAnalyser = context.createAnalyser();
        const leftKWeighting = createKWeightingFilterChain(context); //KWeightFilter mimics human hearing
        const rightKWeighting = createKWeightingFilterChain(context);
        const meterFilterNodes = [
          leftKWeighting?.shelvingFilter,
          leftKWeighting?.highPassFilter,
          rightKWeighting?.shelvingFilter,
          rightKWeighting?.highPassFilter,
        ].filter((node): node is IIRFilterNode => Boolean(node));

        leftAnalyser.fftSize = METER_FFT_SIZE;
        rightAnalyser.fftSize = METER_FFT_SIZE;
        leftAnalyser.smoothingTimeConstant = 0.78;
        rightAnalyser.smoothingTimeConstant = 0.78;

        sourceNode.connect(splitter);
        sourceNode.connect(gainNode);

        if (leftKWeighting) {
          splitter.connect(leftKWeighting.shelvingFilter, 0);
          leftKWeighting.shelvingFilter.connect(leftKWeighting.highPassFilter);
          leftKWeighting.highPassFilter.connect(leftAnalyser);
        } else {
          splitter.connect(leftAnalyser, 0);
        }

        if (rightKWeighting) {
          splitter.connect(rightKWeighting.shelvingFilter, 1);
          rightKWeighting.shelvingFilter.connect(
            rightKWeighting.highPassFilter,
          );
          rightKWeighting.highPassFilter.connect(rightAnalyser);
        } else {
          splitter.connect(rightAnalyser, 1);
        }

        gainNode.gain.value = volume;
        gainNode.connect(context.destination);
        audio.volume = 1;

        audioContextRef.current = context;
        audioSourceNodeRef.current = sourceNode;
        channelSplitterRef.current = splitter;
        gainNodeRef.current = gainNode;
        leftAnalyserRef.current = leftAnalyser;
        meterFilterNodesRef.current = meterFilterNodes;
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
      const audioContext = generateAudioAnalysisGraph(audio);

      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }

      await audio.play();
    },
    [generateAudioAnalysisGraph],
  );

  const {
    currentTime,
    duration,
    handleAudioCanPlay,
    handleAudioDurationChange,
    handleAudioEnded,
    handleAudioError,
    handleAudioLoadedData,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    handleAudioSeeked,
    handleAudioSeeking,
    handleAudioTimeUpdate,
    handlePlaybackToggle,
    handleSeekChange,
    isPlaying,
    selectAdjacentTrack,
    selectTrack,
  } = usePlayback({
    activeTrack,
    activeTrackIndex: activeTrackIndex ?? -1,
    audioRef,
    beginPlayback,
    onResetMeters: resetMeterLevels,
    onSetErrorMessage: setErrorMessage,
    onSetTrackId: setActiveTrackId,
    tracks: library?.tracks ?? [],
  });

  const fallbackDuration = activeTrack
    ? (trackDurations[activeTrack.id] ?? 0)
    : 0;
  const effectiveDuration = duration > 0 ? duration : fallbackDuration;

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
        const nextMeterLevels = readMeterLevels(
          {
            leftAnalyser,
            rightAnalyser,
          },
          {
            leftBuffer,
            rightBuffer,
          },
        );
        nextLeftLevel = nextMeterLevels.left;
        nextRightLevel = nextMeterLevels.right;
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
          hasMeterSettled(previousLevels, {
            left,
            right,
          })
        ) {
          shouldContinue =
            shouldContinue || shouldKeepMeterAnimationActive(previousLevels);
          return previousLevels;
        }

        shouldContinue =
          shouldContinue || shouldKeepMeterAnimationActive({ left, right });
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

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }

    if (audioRef.current) {
      audioRef.current.volume = gainNodeRef.current ? 1 : volume;
    }
  }, [volume]);

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
              summary="Pulling artwork and audio preview sources from the local session assets."
              title="Loading music library…"
            />
          ) : libraryErrorMessage && !library ? (
            <FeedbackCard
              kicker="Backend Error"
              summary={libraryErrorMessage}
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
                onCanPlay={handleAudioCanPlay}
                onDurationChange={handleAudioDurationChange}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                onLoadedData={handleAudioLoadedData}
                onLoadedMetadata={handleAudioLoadedMetadata}
                onPause={handleAudioPause}
                onPlay={handleAudioPlay}
                onSeeked={handleAudioSeeked}
                onSeeking={handleAudioSeeking}
                onTimeUpdate={handleAudioTimeUpdate}
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
