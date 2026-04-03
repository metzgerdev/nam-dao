function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const IDLE_METER_LEVEL = 0.08;
export const METER_FFT_SIZE = 2048;

const METER_GAIN = 3.5;
const VU_RESPONSE_TIME_MS = 300;
const K_WEIGHTING_SHELVING_FEEDFORWARD = [
  1.53512485958697,
  -2.69169618940638,
  1.19839281085285,
];
const K_WEIGHTING_SHELVING_FEEDBACK = [
  1,
  -1.69065929318241,
  0.73248077421585,
];
const K_WEIGHTING_HIGH_PASS_FEEDFORWARD = [1, -2, 1];
const K_WEIGHTING_HIGH_PASS_FEEDBACK = [1, -1.99004745483398, 0.99007225036621];

export interface KWeightingFilterChain {
  highPassFilter: IIRFilterNode;
  shelvingFilter: IIRFilterNode;
}

export interface MeterLevels {
  left: number;
  right: number;
}

interface MeterSignalBuffers {
  leftBuffer: Float32Array<ArrayBufferLike>;
  rightBuffer: Float32Array<ArrayBufferLike>;
}

interface MeterSignalOptions {
  leftAnalyser: AnalyserNode | null;
  rightAnalyser: AnalyserNode | null;
}

const METER_SETTLE_EPSILON = 0.001;

export function computeRms(buffer: Float32Array<ArrayBufferLike>): number {
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

export function hasMeterSettled(
  previousLevels: MeterLevels,
  nextLevels: MeterLevels,
): boolean {
  return (
    Math.abs(nextLevels.left - previousLevels.left) < METER_SETTLE_EPSILON &&
    Math.abs(nextLevels.right - previousLevels.right) < METER_SETTLE_EPSILON
  );
}

export function shouldKeepMeterAnimationActive(levels: MeterLevels): boolean {
  return (
    Math.abs(levels.left - IDLE_METER_LEVEL) > METER_SETTLE_EPSILON ||
    Math.abs(levels.right - IDLE_METER_LEVEL) > METER_SETTLE_EPSILON
  );
}

export function readMeterLevels(
  { leftAnalyser, rightAnalyser }: MeterSignalOptions,
  { leftBuffer, rightBuffer }: MeterSignalBuffers,
): MeterLevels {
  if (!leftAnalyser) {
    return {
      left: IDLE_METER_LEVEL,
      right: IDLE_METER_LEVEL,
    };
  }

  leftAnalyser.getFloatTimeDomainData(leftBuffer as Float32Array<ArrayBuffer>);
  if (rightAnalyser) {
    rightAnalyser.getFloatTimeDomainData(rightBuffer as Float32Array<ArrayBuffer>);
  } else {
    rightBuffer.set(leftBuffer);
  }

  const left = normalizeMeterLevel(computeRms(leftBuffer));
  const rawRightLevel = normalizeMeterLevel(computeRms(rightBuffer));
  const right =
    rawRightLevel <= IDLE_METER_LEVEL + 0.01 && left > IDLE_METER_LEVEL + 0.03
      ? left
      : rawRightLevel;

  return { left, right };
}

export function createKWeightingFilterChain(
  context: AudioContext,
): KWeightingFilterChain | null {
  if (typeof context.createIIRFilter !== "function") {
    return null;
  }

  return {
    highPassFilter: context.createIIRFilter(
      K_WEIGHTING_HIGH_PASS_FEEDFORWARD,
      K_WEIGHTING_HIGH_PASS_FEEDBACK,
    ),
    shelvingFilter: context.createIIRFilter(
      K_WEIGHTING_SHELVING_FEEDFORWARD,
      K_WEIGHTING_SHELVING_FEEDBACK,
    ),
  };
}
