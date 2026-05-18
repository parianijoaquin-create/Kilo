"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { Bar } from "@/components/ui/Bar";
import { Ring } from "@/components/ui/Ring";
import { IconChevronLeft, IconPlus } from "@/components/icons";
import { useSheet } from "@/context/SheetContext";
import { createClient } from "@/lib/supabase/client";

interface FoodDetail {
  id: number;
  source_food_id: string;
  canonical_name: string;
  kcal_100g: number | null;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
  fiber_g_100g: number | null;
  default_portion_g: number | null;
  default_portion_name: string | null;
}

const MACRO_ROWS = (food: FoodDetail) => [
  { label: "Proteína", value: Math.round(food.protein_g_100g ?? 0), unit: "g", max: 50,  color: "var(--lime)",   code: "P" },
  { label: "Carbos",   value: Math.round(food.carbs_g_100g ?? 0),   unit: "g", max: 100, color: "var(--blue)",   code: "C" },
  { label: "Grasas",   value: Math.round(food.fat_g_100g ?? 0),     unit: "g", max: 40,  color: "var(--orange)", code: "G" },
];

export default function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { openSheet } = useSheet();
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const fields = "id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name";

      // Try source_food_id first (string slug), then numeric id
      let { data } = await supabase.from("foods").select(fields).eq("source_food_id", id).maybeSingle();
      if (!data && !isNaN(Number(id))) {
        const res = await supabase.from("foods").select(fields).eq("id", Number(id)).maybeSingle();
        data = res.data;
      }

      setFood(data as FoodDetail | null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <Screen scrollKey="food-detail">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-3)" }}>
            Cargando…
          </div>
        </Screen>
      </AppShell>
    );
  }

  if (!food) {
    return (
      <AppShell>
        <Screen scrollKey="food-detail">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-3)" }}>
            Alimento no encontrado.
          </div>
        </Screen>
      </AppShell>
    );
  }

  const kcal = Math.round(food.kcal_100g ?? 0);
  const kcalPct = Math.min(100, Math.round((kcal / 800) * 100));
  const portionLabel = food.default_portion_name
    ? `${food.default_portion_name} · ${food.default_portion_g ?? 100}g`
    : `${food.default_portion_g ?? 100}g`;

  return (
    <AppShell>
      <Screen scrollKey={`food-${id}`}>
        {/* Back nav */}
        <div style={{ padding: "0 20px 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="kilo-pressable"
            onClick={() => router.back()}
            style={{
              width: 38, height: 38,
              borderRadius: 12,
              background: "var(--bg-1)",
              border: "1px solid var(--line-1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <IconChevronLeft size={18} color="var(--text-2)" />
          </button>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            color: "var(--text-1)",
            margin: 0,
          }}>
            Detalle
          </h1>
        </div>

        {/* Hero card */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{
            background: "linear-gradient(160deg, rgba(198,255,80,0.06) 0%, var(--bg-1) 60%)",
            border: "1px solid rgba(198,255,80,0.15)",
            borderRadius: 22,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: 20,
              background: "var(--bg-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              flexShrink: 0,
            }}>
              🥗
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                color: "var(--text-1)",
                lineHeight: 1.2,
              }}>
                {food.canonical_name}
              </div>
              <div style={{
                fontSize: 11.5,
                color: "var(--text-3)",
                marginTop: 4,
                fontFamily: "var(--font-mono)",
              }}>
                {portionLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Kcal ring + value */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-1)",
            borderRadius: 18,
            padding: 20,
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
                CALORÍAS
              </div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 48,
                fontWeight: 500,
                letterSpacing: "-0.04em",
                color: "var(--lime)",
                lineHeight: 1,
                marginTop: 4,
              }}>
                {kcal}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                kcal · 100g
              </div>
            </div>
            <Ring size={80} stroke={8} value={kcal} max={800} color="var(--lime)">
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-1)",
              }}>
                {kcalPct}%
              </div>
            </Ring>
          </div>
        </div>

        {/* Macro bars */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-1)",
            borderRadius: 18,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>
            {MACRO_ROWS(food).map((m) => (
              <div key={m.code}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 20, height: 20,
                      borderRadius: 6,
                      background: `${m.color}22`,
                      color: m.color,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {m.code}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>
                      {m.label}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 500,
                    color: m.color,
                    letterSpacing: "-0.02em",
                  }}>
                    {m.value}{m.unit}
                  </span>
                </div>
                <Bar value={m.value} max={m.max} color={m.color} height={5} />
              </div>
            ))}
          </div>
        </div>

        {/* Add button */}
        <div style={{ padding: "20px 20px 0" }}>
          <button
            className="kilo-pressable"
            onClick={() => openSheet()}
            style={{
              width: "100%",
              padding: "15px",
              background: "var(--lime)",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              color: "#0a0d15",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <IconPlus size={18} color="#0a0d15" />
            Agregar al diario
          </button>
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}
