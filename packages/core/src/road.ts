import { assertMetricKeys, METRICS, type MetricKey } from "./metrics";
import type { Assumptions, CarSpec } from "./types";

export interface RoadProfile {
  id: string;
  /** Weights per metric; must be ≥ 0 and sum to 1. Stored in DB `road_profiles.weights`. */
  weights: Partial<Record<MetricKey, number>>;
}

export interface RoadRanking {
  ranked: { carId: string; score: number; reason: MetricKey }[];
  /** Cars that could not be scored because a weighted metric has no data. */
  missing: { carId: string; missing: MetricKey[] }[];
}

export function validateWeights(weights: Record<string, number>): asserts weights is Partial<Record<MetricKey, number>> {
  const keys = Object.keys(weights);
  assertMetricKeys(keys);
  if (keys.some((k) => !(weights[k]! >= 0))) throw new Error("Weights must be ≥ 0");
  const sum = keys.reduce((s, k) => s + weights[k]!, 0);
  if (Math.abs(sum - 1) > 1e-6) throw new Error(`Weights must sum to 1 (got ${sum})`);
}

/** Rank cars for a road: min-max normalise each weighted metric across the candidates. */
export function scoreRoad(cars: CarSpec[], profile: RoadProfile, a: Assumptions, topN = 5): RoadRanking {
  validateWeights(profile.weights as Record<string, number>);
  const keys = Object.keys(profile.weights) as MetricKey[];

  const rows = cars.map((car) => ({ car, values: keys.map((k) => METRICS[k].get(car, a)) }));
  const complete = rows.filter((r) => r.values.every((v) => v != null)) as { car: CarSpec; values: number[] }[];
  const missingRows = rows
    .filter((r) => r.values.some((v) => v == null))
    .map((r) => ({ carId: r.car.id, missing: keys.filter((_, i) => r.values[i] == null) }));

  const ranges = keys.map((_, i) => {
    const vals = complete.map((r) => r.values[i]!);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  });

  const scored = complete.map(({ car, values }) => {
    const contrib = keys.map((k, i) => {
      const { min, max } = ranges[i]!;
      let n = max === min ? 1 : (values[i]! - min) / (max - min);
      if (max !== min && !METRICS[k].higherIsBetter) n = 1 - n;
      return profile.weights[k]! * n;
    });
    const best = contrib.reduce((bi, c, i) => (c > contrib[bi]! ? i : bi), 0);
    return { carId: car.id, name: car.name, score: Math.round(contrib.reduce((s, c) => s + c, 0) * 100), reason: keys[best]! };
  });

  scored.sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
  return { ranked: scored.slice(0, topN).map(({ carId, score, reason }) => ({ carId, score, reason })), missing: missingRows };
}
