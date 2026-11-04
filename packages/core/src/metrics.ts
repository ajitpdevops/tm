import { GREEN_SCORE } from "./config/metrics";
import { monthlyRunningCost } from "./translator";
import type { Assumptions, CarSpec } from "./types";

export type MetricKey =
  | "power" | "torque" | "zeroTo100" | "runningCost" | "boot" | "clearance" | "safety" | "price" | "green";

export interface Metric {
  label: string;
  unit: string;
  higherIsBetter: boolean;
  get: (car: CarSpec, a: Assumptions) => number | null;
}

export const METRICS: Record<MetricKey, Metric> = {
  power: { label: "Power", unit: "PS", higherIsBetter: true, get: (c) => c.powerPs },
  torque: { label: "Torque", unit: "Nm", higherIsBetter: true, get: (c) => c.torqueNm },
  zeroTo100: { label: "0–100", unit: "s", higherIsBetter: false, get: (c) => c.zeroTo100S },
  runningCost: {
    label: "Running ₹/month", unit: "₹", higherIsBetter: false,
    get: (c, a) => { const r = monthlyRunningCost(c, a); return r.ok ? r.value : null; },
  },
  boot: { label: "Boot", unit: "L", higherIsBetter: true, get: (c) => c.bootL },
  clearance: { label: "Ground clearance", unit: "mm", higherIsBetter: true, get: (c) => c.groundClearanceMm },
  safety: { label: "Safety", unit: "★", higherIsBetter: true, get: (c) => c.safetyStars },
  price: { label: "Ex-showroom", unit: "₹", higherIsBetter: false, get: (c) => c.exShowroomInr },
  green: { label: "Green", unit: "", higherIsBetter: true, get: (c) => GREEN_SCORE[c.fuel] },
};

export const isMetricKey = (k: string): k is MetricKey => Object.hasOwn(METRICS, k);

export function assertMetricKeys(keys: readonly string[]): asserts keys is MetricKey[] {
  const bad = keys.filter((k) => !isMetricKey(k));
  if (bad.length) throw new Error(`Unknown metric: ${bad.join(", ")}`);
}
