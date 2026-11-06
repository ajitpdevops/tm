import { describe, expect, it } from "vitest";
import { computeTco } from "./tco";
import { alpha, assumptions as A, car, voltEv } from "./test/fixtures";

const own = { servicePerYearInr: 10_000, resalePct: 0.5 };

describe("computeTco", () => {
  it("matches hand-computed 5-year cost (petrol)", () => {
    const r = computeTco(alpha, A, own);
    if (!r.ok) throw new Error("expected ok");
    expect(r.value).toMatchObject({
      onRoadInr: 1_140_000,     // 10L × 1.14
      fuelInr: 583_333,         // 1200/(18×.72)×105 × 60 months
      insuranceInr: 125_400,    // 11% of on-road
      serviceInr: 50_000,
      resaleInr: 570_000,       // 50% of on-road
      netInr: 1_328_733,        // rounded once at the end
      totalKm: 72_000,
      perKmInr: 18.45,
    });
  });

  it("uses the EV on-road multiplier", () => {
    const r = computeTco(voltEv, A, own);
    if (!r.ok) throw new Error("expected ok");
    expect(r.value.onRoadInr).toBe(2_080_000);
    expect(r.value.fuelInr).toBe(1536 * 60);
  });

  it("resale curve: starts at on-road, ends at resale, never rises", () => {
    const r = computeTco(alpha, A, own);
    if (!r.ok) throw new Error("expected ok");
    const c = r.value.resaleCurve;
    expect(c).toHaveLength(A.years + 1);
    expect(c[0]).toEqual({ year: 0, valueInr: 1_140_000 });
    expect(c[A.years]).toEqual({ year: 5, valueInr: 570_000 });
    for (let i = 1; i < c.length; i++) expect(c[i]!.valueInr).toBeLessThanOrEqual(c[i - 1]!.valueInr);
  });

  it("reports every missing input", () => {
    expect(computeTco(car({ exShowroomInr: null, efficiencyKmpl: null }), A, own))
      .toEqual({ ok: false, missing: ["exShowroomInr", "efficiencyKmpl"] });
  });

  it("rejects invalid resale %", () => {
    expect(() => computeTco(alpha, A, { ...own, resalePct: 1.2 })).toThrow();
  });
});
