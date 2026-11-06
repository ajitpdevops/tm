import { assertMetricKeys, METRICS, type MetricKey } from "./metrics";
import type { Assumptions, CarSpec } from "./types";

type Side = "a" | "b";

export interface BattleRound {
  metric: MetricKey;
  a: number | null;
  b: number | null;
  /** null when a value is missing. */
  winner: Side | "tie" | null;
  missing: Side[];
}

export interface BattleResult {
  rounds: BattleRound[];
  score: { a: number; b: number };
  winner: Side | null;
  /** Metrics the overall loser still won. */
  loserWon: MetricKey[];
}

/** Head-to-head on the given metrics. Values and winners come only from data, never the LLM. */
export function battle(a: CarSpec, b: CarSpec, metrics: MetricKey[], assumptions: Assumptions): BattleResult {
  assertMetricKeys(metrics);
  const rounds = metrics.map((metric): BattleRound => {
    const m = METRICS[metric];
    const va = m.get(a, assumptions);
    const vb = m.get(b, assumptions);
    const gaps = [va == null && "a", vb == null && "b"].filter(Boolean) as Side[];
    if (va == null || vb == null) return { metric, a: va, b: vb, winner: null, missing: gaps };
    const winner = va === vb ? "tie" : (m.higherIsBetter ? va > vb : va < vb) ? "a" : "b";
    return { metric, a: va, b: vb, winner, missing: [] };
  });
  const score = {
    a: rounds.filter((r) => r.winner === "a").length,
    b: rounds.filter((r) => r.winner === "b").length,
  };
  const winner = score.a === score.b ? null : score.a > score.b ? "a" : "b";
  const loser = winner === "a" ? "b" : winner === "b" ? "a" : null;
  return { rounds, score, winner, loserWon: loser ? rounds.filter((r) => r.winner === loser).map((r) => r.metric) : [] };
}
