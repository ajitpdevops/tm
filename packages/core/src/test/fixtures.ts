/** TEST-ONLY fake cars and assumptions. Not real vehicles; never seed these into production. */
import type { Assumptions, CarSpec } from "../types";

export const assumptions: Assumptions = {
  kmPerMonth: 1200,
  petrolPerL: 105,
  dieselPerL: 92,
  cngPerKg: 80,
  kwhTariff: 8,
  realWorldIceFactor: 0.72,
  realWorldEvFactor: 0.75,
  onRoadMultiplierIce: 1.14,
  onRoadMultiplierEv: 1.04,
  insurancePctOfOnRoad: 0.11,
  years: 5,
  overtakeFactor: 0.55,
};

const base: CarSpec = {
  id: "x",
  name: "X",
  brand: "Testmotors",
  aliases: [],
  fuel: "petrol",
  exShowroomInr: 1_000_000,
  powerPs: 100,
  torqueNm: 150,
  zeroTo100S: 12,
  efficiencyKmpl: 18,
  rangeKm: null,
  batteryKwh: null,
  bootL: 350,
  groundClearanceMm: 190,
  safetyStars: 4,
};

export const car = (over: Partial<CarSpec>): CarSpec => ({ ...base, ...over });

export const alpha = car({
  id: "alpha", name: "Alpha", aliases: ["alpha", "tm alpha"], fuel: "petrol",
  exShowroomInr: 1_000_000, powerPs: 120, torqueNm: 200, zeroTo100S: 10, efficiencyKmpl: 18,
  bootL: 400, groundClearanceMm: 200, safetyStars: 5,
});
export const bravo = car({
  id: "bravo", name: "Bravo", aliases: ["bravo"], fuel: "diesel",
  exShowroomInr: 1_400_000, powerPs: 115, torqueNm: 250, zeroTo100S: 11, efficiencyKmpl: 20,
  bootL: 450, groundClearanceMm: 190, safetyStars: 4,
});
export const voltEv = car({
  id: "volt", name: "Volt EV", aliases: ["volt", "volt ev"], fuel: "electric",
  exShowroomInr: 2_000_000, powerPs: 200, torqueNm: 300, zeroTo100S: 7, efficiencyKmpl: null,
  rangeKm: 500, batteryKwh: 60, bootL: 380, groundClearanceMm: 205, safetyStars: 5,
});
export const charlieNexus = car({
  id: "nexus", name: "Charlie Nexus", aliases: ["nexus", "charlie nexus"], fuel: "hybrid",
  exShowroomInr: 1_800_000, powerPs: 116, torqueNm: 141, zeroTo100S: 13, efficiencyKmpl: 27,
  bootL: 373, groundClearanceMm: 210, safetyStars: 5,
});
