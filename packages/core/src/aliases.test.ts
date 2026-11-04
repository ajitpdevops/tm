import { describe, expect, it } from "vitest";
import { editDistance, matchCars } from "./aliases";
import { alpha, bravo, charlieNexus, voltEv } from "./test/fixtures";

const cars = [alpha, bravo, voltEv, charlieNexus];
const ids = (q: string) => matchCars(q, cars).map((c) => c.id);

describe("matchCars", () => {
  it("finds two cars in query order", () => {
    expect(ids("Alpha vs Bravo for ghat overtaking")).toEqual(["alpha", "bravo"]);
    expect(ids("bravo vs alpha")).toEqual(["bravo", "alpha"]);
  });
  it("handles typos and transpositions", () => expect(ids("brvo vs alpah")).toEqual(["bravo", "alpha"]));
  it("matches multi-word aliases and dedupes", () => expect(ids("volt ev or the volt vs charlie nexus")).toEqual(["volt", "nexus"]));
  it("respects word boundaries", () => expect(ids("revolt vs alphabet")).toEqual([]));
  it("short aliases need an exact match", () => {
    const tiny = { ...bravo, id: "tiny", name: "Tiny", aliases: ["3xo"] };
    expect(matchCars("3xo vs alpha", [alpha, tiny]).map((c) => c.id)).toEqual(["tiny", "alpha"]);
    expect(matchCars("3xq vs alpha", [alpha, tiny]).map((c) => c.id)).toEqual(["alpha"]);
  });
  it("returns nothing for unrelated text", () => expect(ids("best family car under 10 lakh")).toEqual([]));
});

describe("editDistance (optimal string alignment)", () => {
  it.each([["nexus", "nexsu", 1], ["bravo", "brvo", 1], ["abc", "abc", 0], ["", "ab", 2]])(
    "%s / %s = %d", (a, b, d) => expect(editDistance(a, b)).toBe(d));
});
