import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

const DEFAULT_VOLUME = 0.72;
const KNOB_MIN_ANGLE = -135;
const KNOB_MAX_ANGLE = 135;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function angleToVolume(angle: number): number {
  return clamp(
    (clamp(angle, KNOB_MIN_ANGLE, KNOB_MAX_ANGLE) - KNOB_MIN_ANGLE) /
      (KNOB_MAX_ANGLE - KNOB_MIN_ANGLE),
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

interface UseVolumeResult {
  handleVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleVolumeKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  handleVolumePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleVolumePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handleVolumePointerRelease: (event: PointerEvent<HTMLDivElement>) => void;
  volume: number;
}

export function useVolume(initialVolume = DEFAULT_VOLUME): UseVolumeResult {
  const activePointerIdRef = useRef<number | null>(null);
  const [volume, setVolume] = useState(initialVolume);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setVolume(Number(event.currentTarget.value));
    },
    [],
  );

  const handleVolumePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      activePointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      setVolume(
        volumeFromPointerPosition(
          event.clientX,
          event.clientY,
          event.currentTarget,
        ),
      );
    },
    [],
  );

  const handleVolumePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
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
    },
    [],
  );

  const handleVolumePointerRelease = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      activePointerIdRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const handleVolumeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
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
    },
    [],
  );

  return {
    handleVolumeChange,
    handleVolumeKeyDown,
    handleVolumePointerDown,
    handleVolumePointerMove,
    handleVolumePointerRelease,
    volume,
  };
}
