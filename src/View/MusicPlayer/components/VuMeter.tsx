import type { CSSProperties } from "react";
import type { MeterReadout } from "./types";

interface VuMeterProps {
  meter: MeterReadout;
}

function VuMeter({ meter }: VuMeterProps) {
  const needleAngle = -52 + meter.level * 104;
  const needleStyle = {
    transform: `translateX(-50%) rotate(${needleAngle}deg)`,
  } as CSSProperties;

  return (
    <article className="music-player-vu-meter">
      <div className="music-player-vu-window">
        <div className="music-player-vu-power">POWER (WATTS)</div>
        <div className="music-player-vu-scale" aria-hidden="true">
          <span>1.2mW</span>
          <span>10mW</span>
          <span>.10</span>
          <span>1.0</span>
          <span>10</span>
          <span>100</span>
          <span>200</span>
          <span>300</span>
        </div>
        <div className="music-player-vu-needle" style={needleStyle} />
        <div className="music-player-vu-hub" />
        <div className="music-player-vu-signature">Reference Series</div>
        <div className="music-player-vu-channel">{meter.label}</div>
      </div>
    </article>
  );
}

export default VuMeter;
