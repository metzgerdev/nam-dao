import type {
  ChangeEventHandler,
  KeyboardEventHandler,
  PointerEventHandler,
} from "react";
import VuMeter from "./VuMeter";
import VolumeDeck from "./VolumeDeck";
import type { MeterReadout } from "./types";

interface MeterStripProps {
  leftMeter: MeterReadout | null;
  onVolumeChange: ChangeEventHandler<HTMLInputElement>;
  onVolumeKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onVolumePointerDown: PointerEventHandler<HTMLDivElement>;
  onVolumePointerMove: PointerEventHandler<HTMLDivElement>;
  onVolumePointerRelease: PointerEventHandler<HTMLDivElement>;
  rightMeter: MeterReadout | null;
  volume: number;
}

function MeterStrip({
  leftMeter,
  onVolumeChange,
  onVolumeKeyDown,
  onVolumePointerDown,
  onVolumePointerMove,
  onVolumePointerRelease,
  rightMeter,
  volume,
}: MeterStripProps) {
  return (
    <section className="music-player-meter-strip" aria-label="VU meter display">
      {leftMeter ? <VuMeter meter={leftMeter} /> : null}
      <VolumeDeck
        onVolumeChange={onVolumeChange}
        onVolumeKeyDown={onVolumeKeyDown}
        onVolumePointerDown={onVolumePointerDown}
        onVolumePointerMove={onVolumePointerMove}
        onVolumePointerRelease={onVolumePointerRelease}
        volume={volume}
      />
      {rightMeter ? <VuMeter meter={rightMeter} /> : null}
    </section>
  );
}

export default MeterStrip;
