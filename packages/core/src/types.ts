/** Plain, DB-agnostic inputs for core logic. Every spec is nullable: missing data stays missing. */

export type Fuel = "petrol" | "diesel" | "cng" | "hybrid" | "electric";

export interface CarSpec {
  id: string;
  name: string;
  brand: string;
  aliases: string[];
  fuel: Fuel;
  exShowroomInr: number | null;
  powerPs: number | null;
  torqueNm: number | null;
  zeroTo100S: number | null;
  /** km per litre (km per kg for CNG). Not used for electric. */
  efficiencyKmpl: number | null;
  /** Claimed range, electric only. */
  rangeKm: number | null;
  /** Usable battery, electric only. */
  batteryKwh: number | null;
  bootL: number | null;
  groundClearanceMm: number | null;
  safetyStars: number | null;
}

/** Global assumptions. Source of truth is the DB `assumptions` table; core has no defaults. */
export interface Assumptions {
  kmPerMonth: number;
  petrolPerL: number;
  dieselPerL: number;
  cngPerKg: number;
  kwhTariff: number;
  /** Real-world efficiency as a share of claimed kmpl (e.g. 0.72). */
  realWorldIceFactor: number;
  /** Real-world range as a share of claimed range. */
  realWorldEvFactor: number;
  onRoadMultiplierIce: number;
  onRoadMultiplierEv: number;
  /** Total insurance over the ownership period, as a share of on-road price. */
  insurancePctOfOnRoad: number;
  years: number;
  /** Estimated 60–100 km/h time as a share of 0–100 time. */
  overtakeFactor: number;
}

export type AssumptionKey = keyof Assumptions;

/** Per-car ownership inputs (DB: brand/model resale %, service cost). */
export interface OwnershipInputs {
  servicePerYearInr: number;
  /** Resale value at end of period as a share of on-road price. */
  resalePct: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; missing: string[] };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const missing = <T = never>(...fields: string[]): Result<T> => ({ ok: false, missing: fields });
