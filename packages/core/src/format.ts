/** India-default formatting (CLAUDE.md rule 6). Pure functions, no framework imports. */

function assertAmount(n: number): void {
  if (!Number.isFinite(n) || n < 0) throw new RangeError(`Invalid amount: ${n}`);
}

/** 120000 -> "1,20,000" (Indian digit grouping, whole numbers) */
export function formatIndian(n: number): string {
  assertAmount(n);
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${head},${s.slice(-3)}`;
}

/** 1290000 -> "₹12,90,000" */
export function formatInr(amount: number): string {
  return `₹${formatIndian(amount)}`;
}

const trim = (n: number): string => String(parseFloat(n.toFixed(2)));

/** 1290000 -> "₹12.9L", 15000000 -> "₹1.5Cr" */
export function formatLakh(amount: number): string {
  assertAmount(amount);
  if (amount >= 10_000_000) return `₹${trim(amount / 10_000_000)}Cr`;
  return `₹${trim(amount / 100_000)}L`;
}
