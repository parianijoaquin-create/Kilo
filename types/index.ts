// ─── Enums / union types ─────────────────────────────────────────────────────

export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";
export type GoalType = "lose" | "maintain" | "gain" | "recomp";
export type Sex = "male" | "female" | "other" | "prefer_not_to_say";
export type UnitSystem = "metric" | "imperial";

export type MealType = "morning" | "lunch" | "snack" | "dinner" | "custom";
export type CaptureMethod = "manual" | "search" | "barcode" | "ocr" | "photo" | "recipe";
export type EstimationStatus = "draft" | "estimated" | "pending_review" | "final";

export type HabitFrequency = "daily" | "weekly" | "custom";
export type HabitLogStatus = "done" | "partial" | "skipped";

export type VerificationStatus = "pending" | "verified" | "rejected" | "draft";
export type SourceType = "official" | "community" | "vendor" | "manual";
export type GtinType = "EAN8" | "UPC" | "EAN13" | "GTIN14";

export type HabitColor = "lime" | "blue" | "orange" | "red" | "violet";
export type HabitIcon = "pill" | "droplet" | "moon" | "flame" | "activity" | "leaf" | "runner";

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  kcal: number;
}

export interface MacroSummary {
  current: number;
  goal: number;
  label: string;
  code: string;
}

export interface NutritionSummary {
  protein: MacroSummary;
  carbs: MacroSummary;
  fat: MacroSummary;
}

export interface DayTotals {
  kcalGoal: number;
  kcalLogged: number;
  macros: NutritionSummary;
  water: number;
  waterGoal: number;
  steps: number;
  stepsGoal: number;
}

// ─── User / Profile ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email?: string;
  display_name: string;
  locale: string;
  country_code: string;
  unit_system: UnitSystem;
  birth_date?: string;
  sex?: Sex;
  height_cm?: number;
  current_weight_kg?: number;
  goal_weight_kg?: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
  daily_target_kcal?: number;
  protein_target_g?: number;
  carbs_target_g?: number;
  fat_target_g?: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Food catalog ─────────────────────────────────────────────────────────────

export interface FoodCategory {
  id: number;
  parent_id?: number;
  slug: string;
  name: string;
  sort_order: number;
}

export interface FoodSource {
  id: number;
  code: string;
  name: string;
  source_type: SourceType;
  base_url?: string;
  license_name?: string;
  license_url?: string;
  refresh_strategy?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface Food {
  id: number;
  category_id?: number;
  source_id?: number;
  source_food_id?: string;
  canonical_name: string;
  brand_name?: string;
  country_code: string;
  is_generic: boolean;
  is_recipe: boolean;
  is_verified: boolean;
  verification_status: VerificationStatus;
  confidence_score?: number;
  default_portion_name?: string;
  default_portion_g?: number;
  density_g_ml?: number;
  edible_yield_pct?: number;
  kcal_100g?: number;
  protein_g_100g?: number;
  carbs_g_100g?: number;
  fat_g_100g?: number;
  fiber_g_100g?: number;
  sugar_g_100g?: number;
  sodium_mg_100g?: number;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BarcodeProduct {
  id: number;
  barcode: string;
  food_id: number;
  source_id?: number;
  gtin_type?: GtinType;
  product_name: string;
  brand_name?: string;
  quantity_label?: string;
  serving_size_label?: string;
  ingredients_text?: string;
  image_front_url?: string;
  label_lang: string;
  package_size_value?: number;
  package_size_unit?: string;
  is_official_label: boolean;
  last_synced_at?: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Meals & diary ────────────────────────────────────────────────────────────

export interface MealItem {
  id: string;
  meal_id: string;
  food_id?: number;
  barcode_product_id?: number;
  item_name_snapshot: string;
  quantity?: number;
  unit?: string;
  grams?: number;
  servings?: number;
  calories_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  sugar_g?: number;
  confidence_score: number;
  source_method: CaptureMethod;
  raw_estimation: Record<string, unknown>;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  eaten_at: string;
  meal_type: MealType;
  title?: string;
  capture_method: CaptureMethod;
  estimation_status: EstimationStatus;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: MealItem[];
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  user_id: string;
  code?: string;
  title: string;
  target_value?: number;
  target_unit?: string;
  frequency: HabitFrequency;
  is_active: boolean;
  created_at: string;
  habit_logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  logged_at: string;
  log_date: string;
  value?: number;
  status: HabitLogStatus;
  note?: string;
  created_at: string;
}

// ─── Weight ───────────────────────────────────────────────────────────────────

export interface WeightLog {
  id: string;
  user_id: string;
  logged_at: string;
  weight_kg: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
  note?: string;
  created_at: string;
}

// ─── Mock / UI-specific types ─────────────────────────────────────────────────

export interface MockMealItem {
  id: string;
  emoji: string;
  name: string;
  portion: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface MockMeal {
  id: string;
  name: string;
  time: string;
  icon: "sunrise" | "sun" | "sunset" | "moon";
  kcal: number;
  status: "logged" | "empty";
  items: MockMealItem[];
}

export interface MockHabit {
  id: string;
  name: string;
  dose: string;
  icon: HabitIcon;
  streak: number;
  weekDone: boolean[];
  todayIdx: number;
  doneToday: boolean;
  color: HabitColor;
}

export interface MockFood {
  id: string;
  emoji: string;
  name: string;
  meta: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface MockUser {
  name: string;
  age: number;
  weight: number;
  weightTarget: number;
  height: number;
  activity: string;
  goal: string;
}

export interface MockToday {
  date: string;
  dateShort: string;
  kcalGoal: number;
  kcalLogged: number;
  macros: NutritionSummary;
  steps: number;
  stepsGoal: number;
  water: number;
  waterGoal: number;
}

export interface KiloData {
  user: MockUser;
  today: MockToday;
  meals: MockMeal[];
  habits: MockHabit[];
  weightHistory: number[];
  weightDays: string[];
  frequentFoods: MockFood[];
}
