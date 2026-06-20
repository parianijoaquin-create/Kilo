"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { IconChevronLeft, IconScale, IconTarget } from "@/components/icons";
import { useProfile } from "@/hooks/useProfile";
import { useWeightLog } from "@/hooks/useWeightLog";
import { useToast } from "@/context/ToastContext";
import {
  bmr,
  tdee,
  dailyKcalTarget,
  ageFromBirthDate,
  projectGoal,
  macrosFromPercents,
  percentsFromMacros,
} from "@/lib/nutrition/formulas";
import type { GoalType } from "@/types";

const GOALS: { key: GoalType; label: string; emoji: string }[] = [
  { key: "lose", label: "Perder", emoji: "📉" },
  { key: "maintain", label: "Mantener", emoji: "⚖️" },
  { key: "gain", label: "Ganar", emoji: "📈" },
  { key: "recomp", label: "Recomp", emoji: "🔁" },
];

const card: React.CSSProperties = {
  background: "var(--bg-1)",
  border: "1px solid var(--line-1)",
  borderRadius: 18,
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-2)",
  border: "1px solid var(--line-2)",
  borderRadius: 10,
  color: "var(--text-1)",
  fontSize: 15,
  fontFamily: "var(--font-mono)",
  outline: "none",
  boxSizing: "border-box",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export default function GoalsPage() {
  const router = useRouter();
  const { profile, updateProfile, loading } = useProfile();
  const { latestWeight, logWeight, saving: savingWeight } = useWeightLog();
  const { showToast } = useToast();

  const currentWeight = latestWeight ?? profile?.current_weight_kg ?? null;

  // ── Goal weight + type ──────────────────────────────────────────────
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [goalWeight, setGoalWeight] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  const gType = goalType ?? profile?.goal_type ?? "maintain";
  const gWeightStr = goalWeight ?? (profile?.goal_weight_kg != null ? String(profile.goal_weight_kg) : "");
  const gWeightNum = parseFloat(gWeightStr.replace(",", "."));

  const projection = useMemo(() => {
    if (currentWeight == null || !Number.isFinite(gWeightNum) || gWeightNum <= 0) return null;
    return projectGoal(currentWeight, gWeightNum, gType);
  }, [currentWeight, gWeightNum, gType]);

  async function saveGoal() {
    if (!Number.isFinite(gWeightNum) || gWeightNum <= 0) return;
    setSavingGoal(true);
    const { error } = await updateProfile({ goal_weight_kg: gWeightNum, goal_type: gType });
    setSavingGoal(false);
    showToast({ message: error ? `Error: ${error}` : "Objetivo guardado ✓" });
    if (!error) {
      setGoalType(null);
      setGoalWeight(null);
    }
  }

  // ── Daily kcal (computed fallback) ──────────────────────────────────
  const computedKcal = useMemo(() => {
    if (!profile?.birth_date || profile.height_cm == null || currentWeight == null || !profile.sex) return null;
    const age = ageFromBirthDate(profile.birth_date);
    const basal = bmr({ weight_kg: currentWeight, height_cm: profile.height_cm, age_years: age, sex: profile.sex });
    return dailyKcalTarget(tdee(basal, profile.activity_level), gType);
  }, [profile, currentWeight, gType]);

  const kcalTarget = profile?.daily_target_kcal ?? computedKcal ?? 2000;

  // ── Macros by percentage ────────────────────────────────────────────
  const initialPcts = useMemo(
    () =>
      percentsFromMacros(
        profile?.protein_target_g ?? 0,
        profile?.carbs_target_g ?? 0,
        profile?.fat_target_g ?? 0
      ),
    [profile?.protein_target_g, profile?.carbs_target_g, profile?.fat_target_g]
  );

  const [pPct, setPPct] = useState<number | null>(null);
  const [cPct, setCPct] = useState<number | null>(null);
  const [fPct, setFPct] = useState<number | null>(null);
  const [savingMacros, setSavingMacros] = useState(false);

  const protein = pPct ?? initialPcts.proteinPct;
  const carbs = cPct ?? initialPcts.carbsPct;
  const fat = fPct ?? initialPcts.fatPct;
  const sum = protein + carbs + fat;
  const grams = macrosFromPercents(kcalTarget, protein, carbs, fat);

  async function saveMacros() {
    if (sum !== 100) return;
    setSavingMacros(true);
    const { error } = await updateProfile({
      protein_target_g: grams.protein_g,
      carbs_target_g: grams.carbs_g,
      fat_target_g: grams.fat_g,
    });
    setSavingMacros(false);
    showToast({ message: error ? `Error: ${error}` : "Macros actualizados ✓" });
  }

  // ── Quick weight log ────────────────────────────────────────────────
  const [weightInput, setWeightInput] = useState("");
  async function saveWeight() {
    const kg = parseFloat(weightInput.replace(",", "."));
    if (!Number.isFinite(kg) || kg <= 0) return;
    const { error } = await logWeight(kg);
    showToast({ message: error ? `Error: ${error}` : "Peso registrado ✓" });
    if (!error) setWeightInput("");
  }

  const macroRows: { key: "p" | "c" | "f"; label: string; color: string; pct: number; set: (n: number) => void; g: number }[] = [
    { key: "p", label: "Proteína", color: "var(--lime)", pct: protein, set: setPPct, g: grams.protein_g },
    { key: "c", label: "Hidratos", color: "var(--blue)", pct: carbs, set: setCPct, g: grams.carbs_g },
    { key: "f", label: "Grasas", color: "var(--orange)", pct: fat, set: setFPct, g: grams.fat_g },
  ];

  return (
    <AppShell>
      <Screen scrollKey="goals">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 4px" }}>
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="kilo-pressable"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}
          >
            <IconChevronLeft size={22} color="var(--text-2)" />
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0 }}>
            Objetivos y macros
          </h1>
        </div>

        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Cargando…</div>
        ) : (
          <>
            {/* ── Objetivo de peso ── */}
            <SectionHead title="Objetivo de peso" />
            <div style={{ padding: "0 20px" }}>
              <div style={card}>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {GOALS.map((g) => {
                    const active = gType === g.key;
                    return (
                      <button
                        key={g.key}
                        onClick={() => setGoalType(g.key)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          background: active ? "var(--lime)" : "var(--bg-2)",
                          border: active ? "none" : "1px solid var(--line-2)",
                          borderRadius: 10,
                          color: active ? "#0a0d15" : "var(--text-2)",
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{g.emoji}</span>
                        {g.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      Peso deseado (kg)
                    </label>
                    <input
                      value={gWeightStr}
                      onChange={(e) => setGoalWeight(e.target.value.replace(/[^\d.,]/g, ""))}
                      inputMode="decimal"
                      placeholder="70"
                      style={{ ...inputStyle, marginTop: 6 }}
                    />
                  </div>
                  <div style={{ flex: 1, textAlign: "center", paddingBottom: 4 }}>
                    <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>ACTUAL</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--text-1)" }}>
                      {currentWeight != null ? `${currentWeight}` : "–"}<span style={{ fontSize: 12, color: "var(--text-3)" }}> kg</span>
                    </div>
                  </div>
                </div>

                {/* Projection / recommendation */}
                {projection && (
                  <div style={{
                    marginTop: 14,
                    padding: "12px 14px",
                    background: projection.directionMismatch ? "rgba(255,165,80,0.08)" : "rgba(198,255,80,0.07)",
                    border: `1px solid ${projection.directionMismatch ? "rgba(255,165,80,0.3)" : "rgba(198,255,80,0.25)"}`,
                    borderRadius: 12,
                    fontSize: 12.5,
                    color: "var(--text-2)",
                    lineHeight: 1.5,
                  }}>
                    {projection.reached ? (
                      <>🎯 Ya estás en tu peso objetivo. ¡Buenísimo!</>
                    ) : projection.directionMismatch ? (
                      <>
                        ⚠️ Tu peso deseado no coincide con el objetivo <b>{GOALS.find((g) => g.key === gType)?.label.toLowerCase()}</b>.
                        Ajustá el objetivo o el peso para ver una estimación.
                      </>
                    ) : (
                      <>
                        Ritmo recomendado: <b style={{ color: "var(--text-1)" }}>
                          {projection.weeklyKg > 0 ? "+" : "−"}{Math.abs(projection.weeklyKg).toFixed(2)} kg/semana
                        </b>.
                        <br />
                        Te faltan <b style={{ color: "var(--text-1)" }}>{Math.abs(projection.deltaKg)} kg</b> · llegarías en{" "}
                        <b style={{ color: "var(--text-1)" }}>
                          {projection.weeks} {projection.weeks === 1 ? "semana" : "semanas"}
                          {projection.weeks! >= 4 ? ` (~${Math.round(projection.weeks! / 4.345)} ${Math.round(projection.weeks! / 4.345) === 1 ? "mes" : "meses"})` : ""}
                        </b>
                        {projection.targetDate && <> · aprox. <b style={{ color: "var(--text-1)" }}>{fmtDate(projection.targetDate)}</b></>}.
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={saveGoal}
                  disabled={savingGoal || !Number.isFinite(gWeightNum) || gWeightNum <= 0}
                  className="kilo-pressable"
                  style={{
                    marginTop: 14,
                    width: "100%",
                    padding: "11px 0",
                    background: "var(--lime)",
                    border: "none",
                    borderRadius: 10,
                    color: "#0a0d15",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: savingGoal || !Number.isFinite(gWeightNum) || gWeightNum <= 0 ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <IconTarget size={15} color="#0a0d15" /> {savingGoal ? "Guardando…" : "Guardar objetivo"}
                </button>
              </div>
            </div>

            {/* ── Registrar peso ── */}
            <SectionHead title="Registrar peso de hoy" />
            <div style={{ padding: "0 20px" }}>
              <div style={{ ...card, display: "flex", gap: 10, alignItems: "center" }}>
                <IconScale size={20} color="var(--text-3)" />
                <input
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value.replace(/[^\d.,]/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter") saveWeight(); }}
                  inputMode="decimal"
                  placeholder={currentWeight != null ? String(currentWeight) : "73.4"}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={saveWeight}
                  disabled={savingWeight || !weightInput}
                  className="kilo-pressable"
                  style={{
                    padding: "10px 18px",
                    background: "var(--lime)",
                    border: "none",
                    borderRadius: 10,
                    color: "#0a0d15",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: savingWeight || !weightInput ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {savingWeight ? "…" : "Guardar"}
                </button>
              </div>
            </div>

            {/* ── Macros por porcentaje ── */}
            <SectionHead title="Macros (% de las calorías)" />
            <div style={{ padding: "0 20px" }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 12, color: "var(--text-3)" }}>
                  <span>Objetivo diario</span>
                  <span style={{ color: "var(--text-1)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{kcalTarget} kcal</span>
                </div>

                {macroRows.map((m) => (
                  <div key={m.key} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
                        <span style={{ color: m.color }}>●</span> {m.label}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>
                        <b style={{ color: "var(--text-1)" }}>{m.pct}%</b> · {m.g}g
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={m.pct}
                      onChange={(e) => m.set(Number(e.target.value))}
                      style={{ width: "100%", accentColor: m.color }}
                    />
                  </div>
                ))}

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 4, padding: "8px 12px",
                  background: sum === 100 ? "rgba(198,255,80,0.07)" : "rgba(255,107,107,0.08)",
                  border: `1px solid ${sum === 100 ? "rgba(198,255,80,0.25)" : "rgba(255,107,107,0.3)"}`,
                  borderRadius: 10, fontSize: 12,
                }}>
                  <span style={{ color: "var(--text-2)" }}>Suma</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: sum === 100 ? "var(--lime)" : "var(--red)" }}>
                    {sum}% {sum === 100 ? "✓" : `(debe dar 100%)`}
                  </span>
                </div>

                <button
                  onClick={saveMacros}
                  disabled={savingMacros || sum !== 100}
                  className="kilo-pressable"
                  style={{
                    marginTop: 14,
                    width: "100%",
                    padding: "11px 0",
                    background: "var(--lime)",
                    border: "none",
                    borderRadius: 10,
                    color: "#0a0d15",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: savingMacros || sum !== 100 ? 0.5 : 1,
                  }}
                >
                  {savingMacros ? "Guardando…" : "Guardar macros"}
                </button>
              </div>
            </div>

            <div style={{ height: 24 }} />
          </>
        )}
      </Screen>
    </AppShell>
  );
}
