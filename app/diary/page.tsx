"use client";

import { useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { Ring } from "@/components/ui/Ring";
import { Bar } from "@/components/ui/Bar";
import { Stat } from "@/components/ui/Stat";
import { IconSearch, IconPlus, IconDroplet } from "@/components/icons";
import { KILO_DATA } from "@/data/mock";
import { useDiary, type DiaryMeal, type DiaryItem } from "@/hooks/useDiary";
import { useSheet, type FoodSearchResult } from "@/context/SheetContext";

// TODO: conectar metas a useProfile cuando esté disponible
const GOALS = KILO_DATA.today;

const STANDARD_MEALS = ["morning", "lunch", "snack", "dinner"] as const;

const MEAL_LABELS: Record<string, string> = {
  morning: "Mañana",
  lunch: "Mediodía",
  snack: "Tarde",
  dinner: "Noche",
};
const MEAL_ICONS: Record<string, string> = {
  morning: "🌅",
  lunch: "☀️",
  snack: "🌆",
  dinner: "🌙",
};

const DATE_STRIP = [
  { d: "Sá", n: 9 },
  { d: "Do", n: 10 },
  { d: "Lu", n: 11 },
  { d: "Ma", n: 12 },
  { d: "Mi", n: 13 },
  { d: "Ju", n: 14, today: true },
  { d: "Vi", n: 15, future: true },
];

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

function FoodLogRow({ item, isFirst, isLast }: { item: DiaryItem; isFirst: boolean; isLast: boolean }) {
  return (
    <div
      className="kilo-pressable"
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line-1)",
        borderTopLeftRadius: isFirst ? 14 : 4,
        borderTopRightRadius: isFirst ? 14 : 4,
        borderBottomLeftRadius: isLast ? 14 : 4,
        borderBottomRightRadius: isLast ? 14 : 4,
        borderTop: !isFirst ? "0.5px solid var(--line-1)" : "1px solid var(--line-1)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>🍽️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
          {item.item_name_snapshot}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
          {item.grams ? `${item.grams}g` : "–"}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-2)" }}>
            <span style={{ color: "var(--lime)" }}>P</span> {Math.round(item.protein_g ?? 0)}g
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-2)" }}>
            <span style={{ color: "var(--blue)" }}>C</span> {Math.round(item.carbs_g ?? 0)}g
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-2)" }}>
            <span style={{ color: "var(--orange)" }}>G</span> {Math.round(item.fat_g ?? 0)}g
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 500,
          color: "var(--lime)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {Math.round(item.calories_kcal ?? 0)}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
          kcal
        </div>
      </div>
    </div>
  );
}

function MealSection({
  mealType,
  meal,
  onAdd,
}: {
  mealType: string;
  meal: DiaryMeal | null;
  onAdd: () => void;
}) {
  const items = meal?.meal_items ?? [];
  const mealKcal = Math.round(items.reduce((s, i) => s + (i.calories_kcal ?? 0), 0));

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        padding: "0 4px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{MEAL_ICONS[mealType] ?? "🍽️"}</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
          }}>
            {MEAL_LABELS[mealType] ?? mealType}
          </span>
          {meal && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
              {new Date(meal.eaten_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {mealKcal > 0 && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
            <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{mealKcal}</span> kcal
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <button
          onClick={onAdd}
          style={{
            width: "100%",
            background: "transparent",
            border: "1.5px dashed var(--line-2)",
            borderRadius: 14,
            padding: "14px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: "var(--text-3)",
            fontSize: 12.5,
            fontFamily: "var(--font-body)",
          }}>
          <IconPlus size={14} color="var(--text-3)" />
          Registrá tu {(MEAL_LABELS[mealType] ?? mealType).toLowerCase()}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {items.map((item, idx) => (
            <FoodLogRow
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
            />
          ))}
          <button
            onClick={onAdd}
            style={{
              marginTop: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--lime)",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              alignSelf: "flex-start",
              fontFamily: "var(--font-body)",
            }}>
            <IconPlus size={12} color="var(--lime)" /> Añadir más
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiaryPage() {
  const { openSheet } = useSheet();
  const today = new Date().toISOString().split("T")[0];
  const { meals, totals, addMealItem } = useDiary(today);
  const t = GOALS;

  const addFoodToMeal = useCallback(async (food: FoodSearchResult, mealType: string) => {
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
  }, [addMealItem]);

  const kcalTotal    = Math.round(totals.kcal);
  const proteinTotal = Math.round(totals.protein);
  const carbsTotal   = Math.round(totals.carbs);
  const fatTotal     = Math.round(totals.fat);

  const macroRows = [
    { l: "Proteína", cur: proteinTotal, max: t.macros.protein.goal, code: "P", color: "var(--lime)" },
    { l: "Carbos",   cur: carbsTotal,   max: t.macros.carbs.goal,   code: "C", color: "var(--blue)" },
    { l: "Grasas",   cur: fatTotal,     max: t.macros.fat.goal,     code: "G", color: "var(--orange)" },
  ];

  return (
    <AppShell>
      <Screen scrollKey="diary">
        {/* Header */}
        <div style={{ padding: "0 20px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--text-1)",
              margin: 0,
            }}>
              Diario
            </h1>
            <button style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "var(--bg-1)",
              border: "1px solid var(--line-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}>
              <IconSearch size={18} color="var(--text-2)" />
            </button>
          </div>

          {/* Date strip */}
          <div style={{ marginTop: 16, display: "flex", gap: 6, overflowX: "auto" }}>
            {DATE_STRIP.map((day) => (
              <div
                key={day.n}
                className="kilo-pressable"
                style={{
                  flex: "1 0 0",
                  padding: "8px 0",
                  borderRadius: 12,
                  background: day.today ? "var(--lime)" : "var(--bg-1)",
                  border: day.today ? "none" : "1px solid var(--line-1)",
                  color: day.today ? "#0a0d15" : day.future ? "var(--text-3)" : "var(--text-2)",
                  textAlign: "center",
                  cursor: "pointer",
                  opacity: day.future ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                  {day.d}
                </div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  marginTop: 2,
                  lineHeight: 1,
                }}>
                  {day.n}
                </div>
              </div>
            ))}
          </div>

          {/* Day totals */}
          <div style={{
            marginTop: 16,
            background: "var(--bg-1)",
            border: "1px solid var(--line-1)",
            borderRadius: 18,
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{
                fontSize: 10,
                color: "var(--text-3)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}>
                TOTAL DEL DÍA
              </div>
              <div style={{ marginTop: 4 }}>
                <Stat value={fmtNum(kcalTotal)} unit="kcal" size={32} />
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 6,
                padding: "3px 8px",
                background: "var(--bg-2)",
                borderRadius: 100,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-2)",
              }}>
                <span style={{ color: "var(--lime)" }}>−{t.kcalGoal - kcalTotal}</span>
                de meta {fmtNum(t.kcalGoal)}
              </div>
            </div>
            <Ring size={68} stroke={7} value={kcalTotal} max={t.kcalGoal} color="var(--lime)">
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "var(--text-1)",
              }}>
                {Math.round((kcalTotal / t.kcalGoal) * 100)}%
              </div>
            </Ring>
          </div>

          {/* Macro bars */}
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {macroRows.map((m) => (
              <div key={m.code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: `${m.color}22`,
                  color: m.color,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {m.code}
                </span>
                <div style={{ flex: 1 }}>
                  <Bar value={m.cur} max={m.max} color={m.color} height={4} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-2)", minWidth: 56, textAlign: "right" }}>
                  <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{m.cur}</span>/{m.max}g
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Meal sections */}
        <div style={{ padding: "8px 20px 0" }}>
          {STANDARD_MEALS.map((mealType) => {
            const meal = meals.find((m) => m.meal_type === mealType) ?? null;
            return (
              <MealSection
                key={mealType}
                mealType={mealType}
                meal={meal}
                onAdd={() => openSheet(mealType, addFoodToMeal)}
              />
            );
          })}
        </div>

        {/* Water tracker */}
        <div style={{ padding: "8px 20px 0" }}>
          <div style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-1)",
            borderRadius: 18,
            padding: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <IconDroplet size={18} color="var(--blue)" />
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: 14.5,
                fontWeight: 500,
                letterSpacing: "-0.015em",
                color: "var(--text-1)",
                flex: 1,
              }}>
                Agua
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
                <span style={{ color: "var(--blue)", fontWeight: 600 }}>{t.water}</span>/{t.waterGoal} vasos
              </span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: t.waterGoal }).map((_, i) => (
                <div
                  key={i}
                  className="kilo-pressable"
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 6,
                    background: i < t.water ? "rgba(91,141,239,0.25)" : "var(--bg-2)",
                    border: i < t.water ? "1px solid rgba(91,141,239,0.5)" : "1px solid var(--line-1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {i < t.water && <IconDroplet size={12} color="var(--blue)" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}
