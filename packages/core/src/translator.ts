import { TRANSLATOR as T } from "./config/translator";
import { formatIndian, formatInr } from "./format";
import { missing, ok, type AssumptionKey, type Assumptions, type CarSpec, type Fuel, type Result } from "./types";

export interface Translation<L extends string = string> {
  /** The raw spec, e.g. "382 L boot". */
  spec: string;
  /** The real-life version, e.g. "3 big suitcases + 1 cabin bag". */
  headline: string;
  detail: string;
  /** Assumptions the UI must show on hover/tap (PRD 4.3). */
  assumptionsUsed: AssumptionKey[];
  level?: L;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function runningCostAssumptions(fuel: Fuel): AssumptionKey[] {
  switch (fuel) {
    case "electric": return ["kmPerMonth", "realWorldEvFactor", "kwhTariff"];
    case "diesel": return ["kmPerMonth", "realWorldIceFactor", "dieselPerL"];
    case "cng": return ["kmPerMonth", "realWorldIceFactor", "cngPerKg"];
    case "petrol":
    case "hybrid": return ["kmPerMonth", "realWorldIceFactor", "petrolPerL"];
  }
}

/** Unrounded monthly running cost in ₹. Used by TCO so rounding happens once. */
export function monthlyRunningCostExact(car: CarSpec, a: Assumptions): Result<number> {
  if (car.fuel === "electric") {
    const { rangeKm, batteryKwh } = car;
    if (!rangeKm || !batteryKwh) {
      return missing(...[!rangeKm && "rangeKm", !batteryKwh && "batteryKwh"].filter((x): x is string => !!x));
    }
    const kwhPerKm = batteryKwh / (rangeKm * a.realWorldEvFactor);
    return ok(a.kmPerMonth * kwhPerKm * a.kwhTariff);
  }
  if (!car.efficiencyKmpl) return missing("efficiencyKmpl");
  const price = car.fuel === "diesel" ? a.dieselPerL : car.fuel === "cng" ? a.cngPerKg : a.petrolPerL;
  return ok((a.kmPerMonth / (car.efficiencyKmpl * a.realWorldIceFactor)) * price);
}

/** Monthly running cost in whole ₹ at the user's km/month. */
export function monthlyRunningCost(car: CarSpec, a: Assumptions): Result<number> {
  const r = monthlyRunningCostExact(car, a);
  return r.ok ? ok(Math.round(r.value)) : r;
}

export function translateBoot(bootL: number | null): Result<Translation> {
  if (bootL == null) return missing("bootL");
  const big = Math.floor(bootL / T.boot.bigSuitcaseL);
  const cabin = Math.floor((bootL % T.boot.bigSuitcaseL) / T.boot.cabinBagL);
  const parts = [big && plural(big, "big suitcase"), cabin && plural(cabin, "cabin bag")].filter(Boolean);
  return ok({
    spec: `${bootL} L boot`,
    headline: parts.length ? parts.join(" + ") : "A few soft bags",
    detail: `Counted as ${T.boot.bigSuitcaseL} L suitcases and ${T.boot.cabinBagL} L cabin bags`,
    assumptionsUsed: [],
  });
}

export function translateClearance(mm: number | null): Result<Translation<"confident" | "fine" | "careful">> {
  if (mm == null) return missing("groundClearanceMm");
  const level = mm >= T.clearanceMm.confident ? "confident" : mm >= T.clearanceMm.fine ? "fine" : "careful";
  const headline = {
    confident: "Clears speed breakers fully loaded",
    fine: "Fine on speed breakers, slow down when the car is full",
    careful: "Take speed breakers at an angle with 5 people on board",
  }[level];
  return ok({ spec: `${mm} mm ground clearance`, headline, detail: "Measured unladen", assumptionsUsed: [], level });
}

export function translateOvertake(zeroTo100S: number | null, a: Assumptions): Result<Translation & { estimateS: number }> {
  if (zeroTo100S == null) return missing("zeroTo100S");
  const estimateS = round1(zeroTo100S * a.overtakeFactor);
  return ok({
    spec: `0–100 km/h in ${zeroTo100S} s`,
    headline: `Passes a truck on a ghat in about ${estimateS} s`,
    detail: "Estimated 60–100 km/h time",
    assumptionsUsed: ["overtakeFactor"],
    estimateS,
  });
}

export function translateRunningCost(car: CarSpec, a: Assumptions): Result<Translation & { monthlyInr: number }> {
  const r = monthlyRunningCost(car, a);
  if (!r.ok) return r;
  const spec = car.fuel === "electric"
    ? `${car.rangeKm} km claimed range`
    : `${car.efficiencyKmpl} ${car.fuel === "cng" ? "km/kg" : "kmpl"} claimed`;
  return ok({
    spec,
    headline: `About ${formatInr(r.value)} a month to run ${formatIndian(a.kmPerMonth)} km`,
    detail: car.fuel === "electric" ? "Home charging, real-world range" : "Real-world efficiency, current fuel price",
    assumptionsUsed: runningCostAssumptions(car.fuel),
    monthlyInr: r.value,
  });
}

export function translateTorque(nm: number | null): Result<Translation<"strong" | "comfortable" | "downshift">> {
  if (nm == null) return missing("torqueNm");
  const level = nm >= T.torqueNm.strong ? "strong" : nm >= T.torqueNm.comfortable ? "comfortable" : "downshift";
  const headline = {
    strong: "Pulls cleanly in 3rd gear up a flyover with 5 adults",
    comfortable: "Comfortable overtakes without much downshifting",
    downshift: "Downshift before overtaking when loaded",
  }[level];
  return ok({ spec: `${nm} Nm torque`, headline, detail: "How strong the shove feels", assumptionsUsed: [], level });
}

export function translateSafety(stars: number | null): Result<Translation<"top" | "good" | "average" | "low">> {
  if (stars == null) return missing("safetyStars");
  if (!Number.isInteger(stars) || stars < 0 || stars > 5) throw new RangeError(`Invalid safety rating: ${stars}`);
  const level = stars === 5 ? "top" : stars === 4 ? "good" : stars === 3 ? "average" : "low";
  const headline = {
    top: "Top crash score for adults and kids",
    good: "Good crash score; check the airbags on your variant",
    average: "Average crash score; compare before you buy",
    low: "Low crash score",
  }[level];
  return ok({ spec: `${stars}-star crash rating`, headline, detail: "Global or Bharat NCAP", assumptionsUsed: [], level });
}

export function translateAll(car: CarSpec, a: Assumptions) {
  return {
    boot: translateBoot(car.bootL),
    clearance: translateClearance(car.groundClearanceMm),
    overtake: translateOvertake(car.zeroTo100S, a),
    running: translateRunningCost(car, a),
    torque: translateTorque(car.torqueNm),
    safety: translateSafety(car.safetyStars),
  };
}
