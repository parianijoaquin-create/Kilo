export function fmtNum(n: number): string {
  return n.toLocaleString("es-AR");
}

export function pct(current: number, goal: number): number {
  return Math.min(100, Math.round((current / goal) * 100));
}
