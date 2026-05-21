"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { bmr, tdee, dailyKcalTarget, defaultMacroTargets } from "@/lib/nutrition/formulas";
import type { GoalType, ActivityLevel, Sex } from "@/types";

type Step = "welcome" | "personal" | "goal" | "activity" | "done";

const GOAL_OPTIONS: { value: GoalType; emoji: string; label: string; sub: string }[] = [
  { value: "lose",     emoji: "🔥", label: "Bajar de peso",    sub: "Déficit calórico controlado" },
  { value: "recomp",   emoji: "⚡", label: "Recomposición",    sub: "Perder grasa y ganar músculo" },
  { value: "maintain", emoji: "⚖️", label: "Mantener peso",    sub: "Calorías en equilibrio" },
  { value: "gain",     emoji: "💪", label: "Ganar masa",       sub: "Superávit con entrenamiento" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: "sedentary", label: "Sedentario",    sub: "Trabajo de oficina, poco movimiento" },
  { value: "light",     label: "Ligero",        sub: "1–3 entrenamientos por semana" },
  { value: "moderate",  label: "Moderado",      sub: "3–5 entrenamientos por semana" },
  { value: "very",      label: "Activo",        sub: "6–7 entrenamientos intensos" },
  { value: "extra",     label: "Muy activo",    sub: "Atleta o trabajo físico intenso" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [sex, setSex] = useState<Sex>("prefer_not_to_say");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("lose");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    if (profile.display_name)        setDisplayName(profile.display_name);
    if (profile.birth_date)          setBirthYear(profile.birth_date.slice(0, 4));
    if (profile.sex)                 setSex(profile.sex);
    if (profile.height_cm != null)   setHeightCm(String(profile.height_cm));
    if (profile.current_weight_kg)   setWeightKg(String(profile.current_weight_kg));
    if (profile.goal_weight_kg)      setGoalWeight(String(profile.goal_weight_kg));
    if (profile.goal_type)           setGoalType(profile.goal_type);
    if (profile.activity_level)      setActivityLevel(profile.activity_level);
    setHydrated(true);
  }, [profile, hydrated]);

  async function handleFinish() {
    setSaving(true);
    const birthDate = birthYear ? `${birthYear}-01-01` : undefined;
    const weight = weightKg ? parseFloat(weightKg) : NaN;
    const height = heightCm ? parseFloat(heightCm) : NaN;
    const age = birthYear ? new Date().getFullYear() - parseInt(birthYear, 10) : NaN;

    let kcalTarget: number | undefined;
    let macros: { protein_g: number; carbs_g: number; fat_g: number } | undefined;

    if (Number.isFinite(weight) && Number.isFinite(height) && Number.isFinite(age) && age > 0) {
      const basal = bmr({ weight_kg: weight, height_cm: height, age_years: age, sex });
      kcalTarget = dailyKcalTarget(tdee(basal, activityLevel), goalType);
      macros = defaultMacroTargets(kcalTarget, goalType);
    }

    await updateProfile({
      display_name: displayName || undefined,
      birth_date: birthDate,
      sex,
      height_cm: Number.isFinite(height) ? height : undefined,
      current_weight_kg: Number.isFinite(weight) ? weight : undefined,
      goal_weight_kg: goalWeight ? parseFloat(goalWeight) : undefined,
      goal_type: goalType,
      activity_level: activityLevel,
      daily_target_kcal: kcalTarget,
      protein_target_g: macros?.protein_g,
      carbs_target_g: macros?.carbs_g,
      fat_target_g: macros?.fat_g,
      onboarding_completed: true,
    });
    router.push("/dashboard");
  }

  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      background: "var(--bg-0)",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 56,
              fontWeight: 500,
              letterSpacing: "-0.05em",
              color: "var(--text-1)",
              lineHeight: 1,
            }}>
              kilo<span style={{ color: "var(--lime)" }}>.</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 15, color: "var(--text-2)", lineHeight: 1.5, maxWidth: 280, margin: "12px auto 0" }}>
              Tu app de nutrición y hábitos. Sin dietas mágicas, solo datos reales.
            </div>

            <div style={{ marginTop: 48 }}>
              <label style={labelStyle}>¿Cómo te llamás?</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                style={inputStyle}
                autoFocus
              />
            </div>

            <button
              onClick={() => setStep("personal")}
              style={{ ...primaryBtn, marginTop: 24 }}
            >
              Empezar →
            </button>
          </div>
        )}

        {/* Step: Personal */}
        {step === "personal" && (
          <div>
            <StepHeader current={1} total={3} title="Datos físicos" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
              <div>
                <label style={labelStyle}>Año de nacimiento</label>
                <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="1996" min={1930} max={2010} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sexo biológico</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["male", "female", "other"] as Sex[]).map((s) => (
                    <button key={s} onClick={() => setSex(s)} style={{
                      ...toggleBtn,
                      flex: 1,
                      borderColor: sex === s ? "var(--lime)" : "var(--line-2)",
                      color: sex === s ? "var(--lime)" : "var(--text-2)",
                    }}>
                      {s === "male" ? "Masc." : s === "female" ? "Fem." : "Otro"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Altura (cm)</label>
                  <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="178" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Peso actual (kg)</label>
                  <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="73.4" step={0.1} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={() => setStep("welcome")} style={secondaryBtn}>← Atrás</button>
              <button onClick={() => setStep("goal")} style={{ ...primaryBtn, flex: 1 }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* Step: Goal */}
        {step === "goal" && (
          <div>
            <StepHeader current={2} total={3} title="Tu objetivo" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              {GOAL_OPTIONS.map((g) => (
                <button key={g.value} onClick={() => setGoalType(g.value)} style={{
                  ...cardOptionBtn,
                  borderColor: goalType === g.value ? "var(--lime)" : "var(--line-1)",
                  background: goalType === g.value ? "rgba(198,255,80,0.05)" : "var(--bg-1)",
                }}>
                  <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: goalType === g.value ? "var(--lime)" : "var(--text-1)" }}>{g.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{g.sub}</div>
                  </div>
                  {goalType === g.value && <span style={{ color: "var(--lime)", fontSize: 16 }}>✓</span>}
                </button>
              ))}
              {(goalType === "lose" || goalType === "gain") && (
                <div style={{ marginTop: 4 }}>
                  <label style={labelStyle}>Peso objetivo (kg)</label>
                  <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
                    placeholder="70.0" step={0.1} style={inputStyle} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep("personal")} style={secondaryBtn}>← Atrás</button>
              <button onClick={() => setStep("activity")} style={{ ...primaryBtn, flex: 1 }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* Step: Activity */}
        {step === "activity" && (
          <div>
            <StepHeader current={3} total={3} title="Nivel de actividad" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
              {ACTIVITY_OPTIONS.map((a) => (
                <button key={a.value} onClick={() => setActivityLevel(a.value)} style={{
                  ...cardOptionBtn,
                  borderColor: activityLevel === a.value ? "var(--lime)" : "var(--line-1)",
                  background: activityLevel === a.value ? "rgba(198,255,80,0.05)" : "var(--bg-1)",
                }}>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: activityLevel === a.value ? "var(--lime)" : "var(--text-1)" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{a.sub}</div>
                  </div>
                  {activityLevel === a.value && <span style={{ color: "var(--lime)" }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep("goal")} style={secondaryBtn}>← Atrás</button>
              <button onClick={handleFinish} disabled={saving} style={{ ...primaryBtn, flex: 1 }}>
                {saving ? "Guardando…" : "¡Arrancar! 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepHeader({ current, total, title }: { current: number; total: number; title: string }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i < current ? "var(--lime)" : "var(--line-2)",
            transition: "background var(--motion-state)",
          }} />
        ))}
      </div>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: "-0.03em",
        color: "var(--text-1)",
        margin: 0,
      }}>
        {title}
      </h2>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-3)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontFamily: "var(--font-mono)",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-1)",
  border: "1px solid var(--line-2)",
  borderRadius: 12,
  padding: "13px 16px",
  fontSize: 15,
  color: "var(--text-1)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "var(--font-body)",
};

const primaryBtn: React.CSSProperties = {
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
  width: "100%",
};

const secondaryBtn: React.CSSProperties = {
  padding: "15px 18px",
  background: "var(--bg-1)",
  border: "1px solid var(--line-1)",
  borderRadius: 14,
  fontSize: 13.5,
  color: "var(--text-2)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
};

const toggleBtn: React.CSSProperties = {
  padding: "10px",
  background: "var(--bg-1)",
  border: "1px solid",
  borderRadius: 10,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  transition: "border-color var(--motion-state), color var(--motion-state)",
};

const cardOptionBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  transition: "border-color var(--motion-state), background var(--motion-state)",
};
