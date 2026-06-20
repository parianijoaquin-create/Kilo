import type { ActivityLevel, GoalType, Sex } from "@/types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose: -400,
  maintain: 0,
  gain: 300,
  recomp: -200,
};

/** Mifflin-St Jeor BMR. For "other"/"prefer_not_to_say" uses the midpoint (-78) to avoid biasing toward either branch. */
export function bmr(params: {
  weight_kg: number;
  height_cm: number;
  age_years: number;
  sex: Sex;
}): number {
  const { weight_kg, height_cm, age_years, sex } = params;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age_years;
  if (sex === "male")   return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

/** Total daily energy expenditure */
export function tdee(bmrValue: number, activity: ActivityLevel): number {
  return Math.round(bmrValue * ACTIVITY_MULTIPLIERS[activity]);
}

/** Daily kcal target adjusted for goal */
export function dailyKcalTarget(tdeeValue: number, goal: GoalType): number {
  return tdeeValue + GOAL_ADJUSTMENTS[goal];
}

/** Default macro targets from kcal target */
export function defaultMacroTargets(kcal: number, goal: GoalType): {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
} {
  const proteinRatio = goal === "lose" || goal === "recomp" ? 0.35 : 0.25;
  const fatRatio = 0.25;

  const protein_g = Math.round((kcal * proteinRatio) / 4);
  const fat_g = Math.round((kcal * fatRatio) / 9);
  const carbs_g = Math.round((kcal - protein_g * 4 - fat_g * 9) / 4);

  return { protein_g, carbs_g, fat_g };
}

/**
 * Recommended *signed* weekly weight change (kg/week) for a goal.
 * Negative = lose, positive = gain. Scaled to bodyweight and clamped to
 * evidence-based safe ranges (~0.5–1% of bodyweight per week).
 */
export function recommendedWeeklyChangeKg(goal: GoalType, weightKg: number): number {
  switch (goal) {
    case "lose":
      return -clamp(weightKg * 0.0065, 0.35, 0.9);
    case "gain":
      return clamp(weightKg * 0.0035, 0.2, 0.45);
    case "recomp":
      return -clamp(weightKg * 0.002, 0.1, 0.25);
    case "maintain":
    default:
      return 0;
  }
}

export interface GoalProjection {
  /** kg still to change (signed: current → goal). */
  deltaKg: number;
  /** Recommended signed kg/week for the goal. */
  weeklyKg: number;
  /** Whole weeks to reach the goal at the recommended pace. */
  weeks: number | null;
  /** Estimated arrival date, or null if not computable. */
  targetDate: Date | null;
  /** True when the goal weight contradicts the chosen goal type. */
  directionMismatch: boolean;
  /** True when already at (or past) the goal weight. */
  reached: boolean;
}

/** Projects how long it takes to reach `goalKg` from `currentKg` at the recommended pace. */
export function projectGoal(currentKg: number, goalKg: number, goal: GoalType): GoalProjection {
  const deltaKg = Math.round((goalKg - currentKg) * 10) / 10;
  const weeklyKg = recommendedWeeklyChangeKg(goal, currentKg);

  if (Math.abs(deltaKg) < 0.1) {
    return { deltaKg, weeklyKg, weeks: 0, targetDate: new Date(), directionMismatch: false, reached: true };
  }

  // weeklyKg of 0 (maintain) or goal weight pulling the "wrong" way.
  const directionMismatch = weeklyKg === 0 || Math.sign(deltaKg) !== Math.sign(weeklyKg);
  if (directionMismatch) {
    return { deltaKg, weeklyKg, weeks: null, targetDate: null, directionMismatch: true, reached: false };
  }

  const weeks = Math.ceil(Math.abs(deltaKg) / Math.abs(weeklyKg));
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeks * 7);
  return { deltaKg, weeklyKg, weeks, targetDate, directionMismatch: false, reached: false };
}

/** Macro grams from percentage split of a kcal target (P/C use 4 kcal/g, F uses 9). */
export function macrosFromPercents(
  kcal: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number
): { protein_g: number; carbs_g: number; fat_g: number } {
  return {
    protein_g: Math.round((kcal * (proteinPct / 100)) / 4),
    carbs_g: Math.round((kcal * (carbsPct / 100)) / 4),
    fat_g: Math.round((kcal * (fatPct / 100)) / 9),
  };
}

/** Reverse of macrosFromPercents: derive %s from gram targets (rounded, normalized to 100). */
export function percentsFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number
): { proteinPct: number; carbsPct: number; fatPct: number } {
  const kcal = proteinG * 4 + carbsG * 4 + fatG * 9;
  if (kcal <= 0) return { proteinPct: 30, carbsPct: 40, fatPct: 30 };
  let p = Math.round((proteinG * 4 * 100) / kcal);
  let f = Math.round((fatG * 9 * 100) / kcal);
  let c = 100 - p - f;
  if (c < 0) { c = 0; f = 100 - p; }
  return { proteinPct: p, carbsPct: c, fatPct: f };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function ageFromBirthDate(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
