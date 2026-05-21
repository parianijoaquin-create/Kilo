"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { KcalHeroCard } from "@/components/dashboard/KcalHeroCard";
import { MacroMiniCards } from "@/components/dashboard/MacroMiniCards";
import { HabitRow } from "@/components/dashboard/HabitRow";
import { WeightSpark } from "@/components/dashboard/WeightSpark";
import { MealCard } from "@/components/dashboard/MealCard";
import {
  IconBell,
  IconRunner,
  IconPill,
  IconDroplet,
  IconActivity,
  IconScale,
  IconArrowDown,
  IconPlus,
} from "@/components/icons";
import { Stat } from "@/components/ui/Stat";
import { Bar } from "@/components/ui/Bar";
import { useProfile } from "@/hooks/useProfile";
import { useDiary } from "@/hooks/useDiary";
import { useToday } from "@/hooks/useToday";
import { useHabits } from "@/hooks/useHabits";
import { useWeightLog } from "@/hooks/useWeightLog";
import { useSheet, type FoodSearchResult } from "@/context/SheetContext";
import type { NutritionSummary } from "@/types";

const MEAL_TYPE_LABELS: Record<string, string> = {
  morning: "Mañana",
  lunch: "Mediodía",
  snack: "Tarde",
  dinner: "Noche",
  custom: "Extra",
};

const HABIT_ICON_MAP: Record<string, typeof IconPill> = {
  creatina: IconPill,
  water: IconDroplet,
  hidratacion: IconDroplet,
};


export default function DashboardPage() {
  const router = useRouter();
  const { openSheet } = useSheet();
  const { profile } = useProfile();
  const today = useToday();
  const { meals, totals, addMealItem } = useDiary(today);

  const addFoodToMeal = async (food: FoodSearchResult, mealType: string) => {
    const grams = food.default_portion_g ?? 100;
    const f = grams / 100;
    return addMealItem(mealType, {
      food_id: food.id,
      barcode_product_id: food.barcode_product_id,
      item_name_snapshot: food.canonical_name,
      grams,
      unit: "g",
      calories_kcal: Math.round((food.kcal_100g ?? 0) * f),
      protein_g: Math.round((food.protein_g_100g ?? 0) * f * 10) / 10,
      carbs_g:   Math.round((food.carbs_g_100g ?? 0) * f * 10) / 10,
      fat_g:     Math.round((food.fat_g_100g ?? 0) * f * 10) / 10,
      source_method: food.source_method ?? (food.barcode_product_id ? "barcode" : "manual"),
      raw_estimation: food.barcode_product_id ? { source: "open_food_facts" } : {},
    });
  };
  const { habits, toggleHabit } = useHabits();
  const { latestWeight, sparkData } = useWeightLog();

  const goToDiary  = () => router.push("/diary");
  const goToMacros = () => router.push("/macros");
  const goToHabits = () => router.push("/habits");

  const displayName = profile?.display_name ?? "…";
  const kcalGoal    = profile?.daily_target_kcal ?? 2000;
  const proteinGoal = profile?.protein_target_g ?? 150;
  const carbsGoal   = profile?.carbs_target_g ?? 200;
  const fatGoal     = profile?.fat_target_g ?? 65;

  const todayDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const macros: NutritionSummary = {
    protein: { current: Math.round(totals.protein), goal: Math.round(proteinGoal), label: "Proteína", code: "P" },
    carbs:   { current: Math.round(totals.carbs),   goal: Math.round(carbsGoal),   label: "Carbos",   code: "C" },
    fat:     { current: Math.round(totals.fat),      goal: Math.round(fatGoal),     label: "Grasas",   code: "G" },
  };

  const mealCards = meals.map((m) => ({
    id: m.id,
    meal_type: m.meal_type,
    name: MEAL_TYPE_LABELS[m.meal_type] ?? m.meal_type,
    icon: m.meal_type === "morning" ? "sunrise" : m.meal_type === "lunch" ? "sun" : m.meal_type === "snack" ? "sunset" : "moon",
    time: new Date(m.eaten_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    kcal: Math.round(m.meal_items.reduce((s, i) => s + (i.calories_kcal ?? 0), 0)),
    items: m.meal_items.map((item) => ({
      id: item.id,
      name: item.item_name_snapshot,
      emoji: "🍽️",
      portion: item.grams ? `${item.grams}g` : "–",
      kcal: Math.round(item.calories_kcal ?? 0),
      p: Math.round(item.protein_g ?? 0),
      c: Math.round(item.carbs_g ?? 0),
      f: Math.round(item.fat_g ?? 0),
    })),
  }));

  // First 2 active habits
  const habitPreview = habits.slice(0, 2);
  const todayStr = today;
  const weightKg = profile?.current_weight_kg;

  return (
    <AppShell>
      <Screen scrollKey="dash">
        {/* Header */}
        <div style={{ padding: "0 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{
              fontSize: 11, color: "var(--text-3)", letterSpacing: "0.14em",
              textTransform: "uppercase", fontWeight: 600, marginBottom: 4,
              fontFamily: "var(--font-mono)",
            }}>
              {todayDate.toUpperCase()}
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500,
              letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--text-1)",
              margin: 0, whiteSpace: "nowrap",
            }}>
              Hola, {displayName}<span style={{ color: "var(--lime)" }}>.</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtn}><IconBell size={18} color="var(--text-2)" /></button>
            <button style={iconBtn}><IconRunner size={18} color="var(--lime)" /></button>
          </div>
        </div>

        {/* Kcal hero → navega a Diario */}
        <div style={{ padding: "20px 20px 0" }}>
          <KcalHeroCard kcalLogged={Math.round(totals.kcal)} kcalGoal={kcalGoal} onClick={goToDiary} />
        </div>

        {/* Macro mini cards → navegan a Macros */}
        <SectionHead title="Macros" action="Detalle →" onAction={goToMacros} />
        <MacroMiniCards macros={macros} onClick={goToMacros} />

        {/* Habits preview */}
        {habitPreview.length > 0 && (
          <>
            <SectionHead title="Hábitos de hoy" action="Ver todos →" onAction={goToHabits} />
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {habitPreview.map((h) => {
                const codeKey = h.code?.toLowerCase() ?? "";
                const Icon = HABIT_ICON_MAP[codeKey] ?? IconPill;
                const todayLog = (h as unknown as { habit_logs?: { log_date: string; status: string }[] }).habit_logs?.find(
                  (l) => l.log_date === todayStr
                );
                const done = todayLog?.status === "done";
                return (
                  <HabitRow
                    key={h.id}
                    Icon={Icon}
                    name={h.title}
                    sub={h.target_value ? `${h.target_value}${h.target_unit ? " " + h.target_unit : ""} · ${h.frequency === "daily" ? "diaria" : h.frequency}` : h.frequency === "daily" ? "diaria" : h.frequency}
                    streak={0}
                    done={done}
                    color={done ? "var(--lime)" : "var(--blue)"}
                    onClick={goToHabits}
                    onToggle={() => toggleHabit(h.id)}
                  />
                );
              })}
            </div>
          </>
        )}

        {habitPreview.length === 0 && (
          <>
            <SectionHead title="Hábitos de hoy" action="Ver todos →" onAction={goToHabits} />
            <div style={{ padding: "0 20px" }}>
              <div style={{
                background: "var(--bg-1)", border: "1.5px dashed var(--line-2)",
                borderRadius: 18, padding: 16, textAlign: "center",
                color: "var(--text-3)", fontSize: 12.5,
              }}>
                Creá tu primer hábito en la sección Hábitos
              </div>
            </div>
          </>
        )}

        {/* Steps + Weight */}
        <div style={{ padding: "16px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Steps – placeholder */}
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <IconActivity size={18} color="var(--blue)" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>–%</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <Stat value="–" size={26} />
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4, marginBottom: 10 }}>
              pasos / meta 10.000
            </div>
            <Bar value={0} max={10000} color="var(--blue)" height={4} />
          </div>

          {/* Weight → navega a Perfil */}
          <div
            onClick={() => router.push("/profile")}
            className="kilo-pressable"
            style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 14, cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <IconScale size={18} color="var(--lime)" />
              {sparkData.length >= 2 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--lime)", display: "flex", alignItems: "center", gap: 2 }}>
                  <IconArrowDown size={10} color="var(--lime)" />
                  {Math.abs(sparkData[sparkData.length - 1] - sparkData[sparkData.length - 2]).toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <Stat value={latestWeight != null ? String(latestWeight) : (weightKg != null ? String(weightKg) : "–")} unit="kg" size={26} />
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4, marginBottom: 8 }}>
              {sparkData.length > 0 ? `peso · ${sparkData.length} registros` : "peso · registrá en Perfil"}
            </div>
            <WeightSpark data={sparkData} />
          </div>
        </div>

        {/* Meals → "Ver diario" navega a Diario */}
        <SectionHead title="Hoy comí" action="Ver diario →" onAction={goToDiary} />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {mealCards.length > 0 ? (
            mealCards.map((meal) => (
              <MealCard key={meal.id} meal={meal as never} onAdd={() => openSheet(meal.meal_type, addFoodToMeal)} />
            ))
          ) : (
            <button
              onClick={() => openSheet("morning", addFoodToMeal)}
              style={{
                width: "100%", background: "transparent",
                border: "1.5px dashed var(--line-2)", borderRadius: 16,
                padding: "18px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, color: "var(--text-3)", fontSize: 13,
                fontFamily: "var(--font-body)",
              }}
            >
              <IconPlus size={16} color="var(--lime)" />
              Registrá tu primera comida del día
            </button>
          )}
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}

const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12,
  background: "var(--bg-1)", border: "1px solid var(--line-1)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};
