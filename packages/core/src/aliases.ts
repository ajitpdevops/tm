import type { CarSpec } from "./types";

/** Optimal string alignment distance (Levenshtein + adjacent transpositions). */
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** Typo budget by alias length: short aliases (e.g. "3xo") must match exactly. */
const budget = (len: number) => (len < 4 ? 0 : len < 7 ? 1 : 2);

/** Find cars named in free text ("Nexon vs 3XO"), in the order they appear, tolerant of typos. */
export function matchCars(query: string, cars: CarSpec[], limit = 2): CarSpec[] {
  const tokens = normalise(query).split(" ").filter(Boolean);
  const hits: { car: CarSpec; pos: number; dist: number }[] = [];

  for (const car of cars) {
    let best: { pos: number; dist: number } | null = null;
    for (const alias of new Set([car.name, ...car.aliases].map(normalise))) {
      const n = alias.split(" ").length;
      for (let pos = 0; pos + n <= tokens.length; pos++) {
        const dist = editDistance(tokens.slice(pos, pos + n).join(" "), alias);
        if (dist > budget(alias.length)) continue;
        if (!best || pos < best.pos || (pos === best.pos && dist < best.dist)) best = { pos, dist };
      }
    }
    if (best) hits.push({ car, ...best });
  }
  return hits.sort((x, y) => x.pos - y.pos || x.dist - y.dist).slice(0, limit).map((h) => h.car);
}
