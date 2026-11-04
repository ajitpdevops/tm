import { describe, expect, it } from "vitest";
import { battle } from "./battle";
import { alpha, assumptions as A, bravo, car } from "./test/fixtures";

describe("battle", () => {
  it("scores rounds from data and names what the loser still won", () => {
    const r = battle(alpha, bravo, ["power", "torque", "zeroTo100", "safety"], A);
    expect(r.score).toEqual({ a: 3, b: 1 });
    expect(r.winner).toBe("a");
    expect(r.loserWon).toEqual(["torque"]);
    expect(r.rounds.find((x) => x.metric === "zeroTo100")!.winner).toBe("a"); // lower is better
  });

  it("running cost: lower wins", () => {
    const r = battle(alpha, bravo, ["runningCost"], A);
    expect(r.rounds[0]).toMatchObject({ a: 9722, b: 7667, winner: "b" });
  });

  it("equal values are a tied round; equal score is a tie", () => {
    const twin = { ...alpha, id: "twin" };
    const r = battle(alpha, twin, ["power", "torque"], A);
    expect(r.rounds.every((x) => x.winner === "tie")).toBe(true);
    expect(r.winner).toBeNull();
  });

  it("missing values are not counted", () => {
    const r = battle(alpha, car({ id: "m", torqueNm: null }), ["torque"], A);
    expect(r.rounds[0]).toMatchObject({ winner: null, missing: ["b"] });
    expect(r.score).toEqual({ a: 0, b: 0 });
  });

  it("rejects unknown metrics", () => {
    expect(() => battle(alpha, bravo, ["nope" as never], A)).toThrow(/Unknown metric/);
  });
});
