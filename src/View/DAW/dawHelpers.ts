import type { TrackLabel } from "../../data/instruments";

export const TRACK_TINTS: Partial<Record<TrackLabel, string>> = {
  "Track 1": "daw-step-cell--primary",   // kick
  "Track 2": "daw-step-cell--primary",   // snare
  "Track 3": "daw-step-cell--cool",      // open hat
  "Track 4": "daw-step-cell--cool",      // closed hat
  "Track 5": "daw-step-cell--cool",      // ride
  "Track 6": "daw-step-cell--secondary", // bass
  "Track 7": "daw-step-cell--secondary", // piano
  "Track 8": "daw-step-cell--secondary", // arp
  "Track 9": "daw-step-cell--secondary", // vocal 1
  "Track 10": "daw-step-cell--secondary", // vocal 2
};

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
