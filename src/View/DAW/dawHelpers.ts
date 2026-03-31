import type { InstrumentName } from "../../data/instruments";

export const TRACK_TINTS: Partial<Record<InstrumentName, string>> = {
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

export function formatTrackName(trackName: InstrumentName): string {
  return trackName
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toUpperCase();
}

export function formatTrackIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function buildWaveformPath(
  audioBuffer: AudioBuffer | null,
  pointCount = 28,
): string {
  if (!audioBuffer || typeof audioBuffer.getChannelData !== "function") {
    return "";
  }

  const channelData = audioBuffer.getChannelData(0);
  if (!channelData?.length) {
    return "";
  }

  const bucketSize = Math.max(1, Math.floor(channelData.length / pointCount));
  const topPoints: string[] = [];
  const bottomPoints: string[] = [];

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
    topPoints.push(
      `${pointIndex === 0 ? "M" : "L"} ${x.toFixed(2)} ${topY.toFixed(2)}`,
    );
    bottomPoints.unshift(`L ${x.toFixed(2)} ${bottomY.toFixed(2)}`);
  }

  return `${topPoints.join(" ")} ${bottomPoints.join(" ")} Z`;
}
