import { describe, expect, it } from "vitest";
import {
  monthlyRunningCost, translateAll, translateBoot, translateClearance,
  translateOvertake, translateSafety, translateTorque,
} from "./translator";
import { alpha, assumptions as A, bravo, car, charlieNexus, voltEv } from "./test/fixtures";

const value = <T>(r: { ok: boolean; value?: T }) => {
  if (!r.ok) throw new Error("expected ok");
  return r.value as T;
};

describe("monthlyRunningCost", () => {
  it("petrol: km / (kmpl × real-world) × price", () =>
    expect(value(monthlyRunningCost(alpha, A))).toBe(9722)); // 1200/(18*.72)*105
  it("diesel uses diesel price", () => expect(value(monthlyRunningCost(bravo, A))).toBe(7667));
  it("hybrid uses petrol price", () => expect(value(monthlyRunningCost(charlieNexus, A))).toBe(6481));
  it("cng uses km/kg and cng price", () =>
    expect(value(monthlyRunningCost(car({ fuel: "cng", efficiencyKmpl: 25 }), A))).toBe(5333));
  it("electric uses the car's own kWh/km, not a constant", () => {
    expect(value(monthlyRunningCost(voltEv, A))).toBe(1536); // 60/(500*.75)=.16 kWh/km
    const thirsty = { ...voltEv, batteryKwh: 90 };
    expect(value(monthlyRunningCost(thirsty, A))).toBe(2304);
  });
  it("respects user km/month", () =>
    expect(value(monthlyRunningCost(alpha, { ...A, kmPerMonth: 600 }))).toBe(4861));
  it("reports missing fields instead of guessing", () => {
    expect(monthlyRunningCost(car({ efficiencyKmpl: null }), A)).toEqual({ ok: false, missing: ["efficiencyKmpl"] });
    expect(monthlyRunningCost({ ...voltEv, rangeKm: null, batteryKwh: null }, A))
      .toEqual({ ok: false, missing: ["rangeKm", "batteryKwh"] });
  });
});

describe("translateBoot", () => {
  it.each([
    [400, "3 big suitcases + 1 cabin bag"],
    [345, "3 big suitcases"],
    [115, "1 big suitcase"],
    [114, "2 cabin bags"],
    [235, "2 big suitcases"],
    [30, "A few soft bags"],
  ])("%d L -> %s", (l, out) => expect(value(translateBoot(l)).headline).toBe(out));
  it("missing", () => expect(translateBoot(null)).toEqual({ ok: false, missing: ["bootL"] }));
});

describe("translateClearance thresholds", () => {
  it.each([
    [200, "confident"], [199, "fine"], [193, "fine"], [192, "careful"],
  ])("%d mm -> %s", (mm, level) => expect(value(translateClearance(mm)).level).toBe(level));
});

describe("translateOvertake", () => {
  it("60–100 estimate = 0–100 × overtakeFactor", () => {
    const t = value(translateOvertake(10, A));
    expect(t.estimateS).toBe(5.5);
    expect(t.headline).toContain("5.5 s");
    expect(t.assumptionsUsed).toContain("overtakeFactor");
  });
});

describe("translateTorque thresholds", () => {
  it.each([
    [220, "strong"], [219, "comfortable"], [165, "comfortable"], [164, "downshift"],
  ])("%d Nm -> %s", (nm, level) => expect(value(translateTorque(nm)).level).toBe(level));
});

describe("translateSafety", () => {
  it.each([[5, "top"], [4, "good"], [3, "average"], [2, "low"], [0, "low"]])(
    "%d stars -> %s", (s, level) => expect(value(translateSafety(s)).level).toBe(level));
  it("rejects impossible ratings", () => {
    expect(() => translateSafety(6)).toThrow();
    expect(() => translateSafety(-1)).toThrow();
  });
});

describe("translateAll", () => {
  it("returns every translation and keeps missing ones explicit", () => {
    const t = translateAll(car({ bootL: null }), A);
    expect(t.boot).toEqual({ ok: false, missing: ["bootL"] });
    expect(t.running.ok).toBe(true);
    expect(Object.keys(t).sort()).toEqual(["boot", "clearance", "overtake", "running", "safety", "torque"]);
  });
  it("running-cost translation lists the assumptions it used", () => {
    const r = value(translateAll(alpha, A).running);
    expect(r.headline).toBe("About ₹9,722 a month to run 1,200 km");
    expect(r.assumptionsUsed).toEqual(["kmPerMonth", "realWorldIceFactor", "petrolPerL"]);
  });
});

describe("monthlyRunningCost EV edge cases", () => {
  it("only battery missing", () =>
    expect(monthlyRunningCost({ ...voltEv, batteryKwh: null }, A)).toEqual({ ok: false, missing: ["batteryKwh"] }));
});
