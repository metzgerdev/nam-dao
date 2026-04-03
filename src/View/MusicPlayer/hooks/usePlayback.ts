import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";
import type { MusicTrack } from "../mockMusicPlayerApi";

const AUDIO_FILE_ERROR_MESSAGE = "This audio file could not be played.";
const PLAYBACK_BLOCKED_MESSAGE =
  "Playback is blocked until the browser allows audio for this page.";

interface UsePlaybackOptions {
  activeTrack: MusicTrack | null;
  activeTrackIndex: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  beginPlayback: (audio: HTMLAudioElement) => Promise<void>;
  onResetMeters: () => void;
  onSetErrorMessage: (message: string | null) => void;
  onSetTrackId: (trackId: string | null) => void;
  tracks: MusicTrack[];
}

interface UsePlaybackResult {
  currentTime: number;
  duration: number;
  handleAudioCanPlay: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioDurationChange: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioEnded: () => void;
  handleAudioError: () => void;
  handleAudioLoadedData: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioLoadedMetadata: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioPause: () => void;
  handleAudioPlay: () => void;
  handleAudioSeeked: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioSeeking: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioTimeUpdate: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handlePlaybackToggle: () => void;
  handleSeekChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isPlaying: boolean;
  selectAdjacentTrack: (direction: -1 | 1) => void;
  selectTrack: (trackId: string) => void;
}

export function usePlayback({
  activeTrack,
  activeTrackIndex,
  audioRef,
  beginPlayback,
  onResetMeters,
  onSetErrorMessage,
  onSetTrackId,
  tracks,
}: UsePlaybackOptions): UsePlaybackResult {
  const pendingAutoplayRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const syncTransportState = useCallback((audio: HTMLAudioElement) => {
    setCurrentTime(audio.currentTime);
    setDuration(
      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0,
    );
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeTrack) {
      return;
    }

    setCurrentTime(0);
    setDuration(0);
    onSetErrorMessage(null);
    onResetMeters();
    audio.currentTime = 0;
    audio.load();
    syncTransportState(audio);

    if (pendingAutoplayRef.current) {
      pendingAutoplayRef.current = false;
      void beginPlayback(audio).then(
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          onSetErrorMessage(PLAYBACK_BLOCKED_MESSAGE);
        },
      );
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, [
    activeTrack,
    audioRef,
    beginPlayback,
    onResetMeters,
    onSetErrorMessage,
    syncTransportState,
  ]);

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
  }, [audioRef, isPlaying, syncTransportState]);

  const selectTrack = useCallback(
    (trackId: string) => {
      pendingAutoplayRef.current = isPlaying;
      onSetTrackId(trackId);
    },
    [isPlaying, onSetTrackId],
  );

  const selectAdjacentTrack = useCallback(
    (direction: -1 | 1) => {
      if (!tracks.length) {
        return;
      }

      const currentIndex =
        typeof activeTrackIndex === "number" && activeTrackIndex >= 0
          ? activeTrackIndex
          : 0;
      const nextIndex = (currentIndex + direction + tracks.length) % tracks.length;

      pendingAutoplayRef.current = isPlaying;
      onSetTrackId(tracks[nextIndex]?.id ?? null);
    },
    [activeTrackIndex, isPlaying, onSetTrackId, tracks],
  );

  const handlePlaybackToggle = useCallback(() => {
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
        onSetErrorMessage(null);
        setIsPlaying(true);
      },
      () => {
        setIsPlaying(false);
        onSetErrorMessage(PLAYBACK_BLOCKED_MESSAGE);
      },
    );
  }, [activeTrack, audioRef, beginPlayback, isPlaying, onSetErrorMessage]);

  const handleSeekChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      const nextTime = Number(event.currentTarget.value);

      setCurrentTime(nextTime);

      if (audio) {
        audio.currentTime = nextTime;
      }
    },
    [audioRef],
  );

  const handleAudioEnded = useCallback(() => {
    if (!tracks.length) {
      setIsPlaying(false);
      return;
    }

    const nextIndex =
      typeof activeTrackIndex === "number" && activeTrackIndex >= 0
        ? (activeTrackIndex + 1) % tracks.length
        : 0;

    pendingAutoplayRef.current = true;
    onSetTrackId(tracks[nextIndex]?.id ?? null);
  }, [activeTrackIndex, onSetTrackId, tracks]);

  const handleAudioError = useCallback(() => {
    setIsPlaying(false);
    onSetErrorMessage(AUDIO_FILE_ERROR_MESSAGE);
  }, [onSetErrorMessage]);

  const handleAudioPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleAudioPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleAudioCanPlay = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  const handleAudioDurationChange = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  const handleAudioLoadedData = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  const handleAudioLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  const handleAudioSeeked = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  const handleAudioSeeking = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  const handleAudioTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      syncTransportState(event.currentTarget);
    },
    [syncTransportState],
  );

  return {
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
  };
}
