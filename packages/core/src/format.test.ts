import { describe, expect, it } from "vitest";
import { formatInr, formatLakh } from "./format";

describe("formatInr (Indian digit grouping)", () => {
  it.each([
    [0, "₹0"],
    [999, "₹999"],
    [1000, "₹1,000"],
    [120000, "₹1,20,000"],
    [1290000, "₹12,90,000"],
    [12345678, "₹1,23,45,678"],
  ])("%d -> %s", (n, out) => expect(formatInr(n)).toBe(out));

  it("rounds to whole rupees", () => expect(formatInr(1000.6)).toBe("₹1,001"));
  it("rejects non-finite or negative values", () => {
    expect(() => formatInr(NaN)).toThrow();
    expect(() => formatInr(-1)).toThrow();
  });
});

describe("formatLakh", () => {
  it.each([
    [1290000, "₹12.9L"],
    [1000000, "₹10L"],
    [549000, "₹5.49L"],
    [10000000, "₹1Cr"],
    [15000000, "₹1.5Cr"],
    [90000, "₹0.9L"],
  ])("%d -> %s", (n, out) => expect(formatLakh(n)).toBe(out));
});
