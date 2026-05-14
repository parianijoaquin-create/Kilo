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

/** Mifflin-St Jeor BMR */
export function bmr(params: {
  weight_kg: number;
  height_cm: number;
  age_years: number;
  sex: Sex;
}): number {
  const { weight_kg, height_cm, age_years, sex } = params;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age_years;
  return sex === "male" ? base + 5 : base - 161;
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

export function ageFromBirthDate(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
