// Lightweight haptic feedback. No-ops on devices/browsers without vibration.
type Pattern = "tap" | "arm" | "success" | "delete";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  arm: 12,
  success: [12, 40, 12],
  delete: 24,
};

export function haptic(pattern: Pattern = "tap") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
