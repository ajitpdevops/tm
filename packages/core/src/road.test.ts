import { describe, expect, it } from "vitest";
import { scoreRoad } from "./road";
import { alpha, assumptions as A, bravo, car, voltEv } from "./test/fixtures";

const ghat = { id: "ghat", weights: { torque: 0.4, power: 0.3, zeroTo100: 0.3 } };

describe("scoreRoad", () => {
  it("ranks by weighted, min-max normalised score", () => {
    const r = scoreRoad([alpha, bravo, voltEv], ghat, A);
    expect(r.ranked.map((x) => [x.carId, x.score])).toEqual([["volt", 100], ["bravo", 20], ["alpha", 9]]);
    expect(r.ranked[0]!.reason).toBe("torque");
  });

  it("limits to top N", () =>
    expect(scoreRoad([alpha, bravo, voltEv], ghat, A, 2).ranked).toHaveLength(2));

  it("lower-is-better metrics are inverted", () => {
    const r = scoreRoad([alpha, bravo], { id: "cost", weights: { price: 1 } }, A);
    expect(r.ranked[0]!.carId).toBe("alpha");
  });

  it("cars missing a weighted metric are listed, not scored", () => {
    const noTorque = car({ id: "nt", name: "No Torque", torqueNm: null });
    const r = scoreRoad([alpha, bravo, noTorque], ghat, A);
    expect(r.ranked.map((x) => x.carId)).not.toContain("nt");
    expect(r.missing).toEqual([{ carId: "nt", missing: ["torque"] }]);
  });

  it("all-equal values do not divide by zero", () => {
    const r = scoreRoad([car({ id: "a", name: "A" }), car({ id: "b", name: "B" })], ghat, A);
    expect(r.ranked.map((x) => x.score)).toEqual([100, 100]);
  });

  it("validates weights", () => {
    expect(() => scoreRoad([alpha], { id: "x", weights: { torque: 0.5 } }, A)).toThrow(/sum to 1/);
    expect(() => scoreRoad([alpha], { id: "x", weights: { nope: 1 } as never }, A)).toThrow(/Unknown metric/);
    expect(() => scoreRoad([alpha], { id: "x", weights: { torque: 1.5, power: -0.5 } }, A)).toThrow();
  });
});
