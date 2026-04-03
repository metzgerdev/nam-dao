function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const IDLE_METER_LEVEL = 0.08;
export const METER_FFT_SIZE = 2048;

const METER_GAIN = 3.5;
const VU_RESPONSE_TIME_MS = 300;

export function computeRms(buffer: Float32Array): number {
  let sum = 0;

  for (let index = 0; index < buffer.length; index += 1) {
    const sample = buffer[index] ?? 0;
    sum += sample * sample;
  }

  return Math.sqrt(sum / buffer.length);
}

export function normalizeMeterLevel(rms: number): number {
  return clamp(rms * METER_GAIN, IDLE_METER_LEVEL, 0.96);
}

export function calculateVuBlend(deltaTimeMs: number): number {
  return clamp(1 - Math.pow(0.01, deltaTimeMs / VU_RESPONSE_TIME_MS), 0, 1);
}

export function smoothMeterLevel(
  previous: number,
  next: number,
  deltaTimeMs: number,
): number {
  const smoothing = calculateVuBlend(deltaTimeMs);
  return previous + (next - previous) * smoothing;
}
