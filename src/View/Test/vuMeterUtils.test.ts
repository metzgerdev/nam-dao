import { describe, expect, jest, test } from "bun:test";
import {
  calculateVuBlend,
  createKWeightingFilterChain,
  computeRms,
  IDLE_METER_LEVEL,
  normalizeMeterLevel,
  smoothMeterLevel,
} from "../MusicPlayer/vuMeterUtils";

describe("vuMeterUtils", () => {
  test("computes RMS for silent and constant buffers", () => {
    expect(computeRms(new Float32Array([0, 0, 0, 0]))).toBe(0);
    expect(computeRms(new Float32Array([0.5, 0.5, 0.5, 0.5]))).toBeCloseTo(
      0.5,
      5,
    );
  });

  test("normalizes meter levels with idle and ceiling clamps", () => {
    expect(normalizeMeterLevel(0)).toBe(IDLE_METER_LEVEL);
    expect(normalizeMeterLevel(0.1)).toBeCloseTo(0.35, 5);
    expect(normalizeMeterLevel(10)).toBe(0.96);
  });

  test("matches the 300ms VU response target", () => {
    expect(calculateVuBlend(-50)).toBe(0);
    expect(calculateVuBlend(0)).toBe(0);
    expect(calculateVuBlend(300)).toBeCloseTo(0.99, 5);
  });

  test("smooths toward the next level using the VU response curve", () => {
    expect(smoothMeterLevel(IDLE_METER_LEVEL, 0.96, 0)).toBe(
      IDLE_METER_LEVEL,
    );
    expect(smoothMeterLevel(0.08, 0.96, 300)).toBeCloseTo(0.9512, 4);
    expect(smoothMeterLevel(0.96, IDLE_METER_LEVEL, 300)).toBeCloseTo(
      0.0888,
      4,
    );
  });

  test("creates the K-weighting shelving and high-pass filter stages", () => {
    const shelvingFilter = { kind: "shelving" } as unknown as IIRFilterNode;
    const highPassFilter = { kind: "high-pass" } as unknown as IIRFilterNode;
    const createIIRFilter = jest
      .fn()
      .mockReturnValueOnce(highPassFilter)
      .mockReturnValueOnce(shelvingFilter);
    const context = {
      createIIRFilter,
    } as unknown as AudioContext;

    const chain = createKWeightingFilterChain(context);

    expect(chain).toEqual({
      highPassFilter,
      shelvingFilter,
    });
    expect(createIIRFilter).toHaveBeenNthCalledWith(
      1,
      [1, -2, 1],
      [1, -1.99004745483398, 0.99007225036621],
    );
    expect(createIIRFilter).toHaveBeenNthCalledWith(
      2,
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [1, -1.69065929318241, 0.73248077421585],
    );
  });
});
