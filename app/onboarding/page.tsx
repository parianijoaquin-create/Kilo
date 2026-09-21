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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    const frame = window.requestAnimationFrame(() => {
      if (profile.display_name)        setDisplayName(profile.display_name);
      if (profile.birth_date)          setBirthYear(profile.birth_date.slice(0, 4));
      if (profile.sex)                 setSex(profile.sex);
      if (profile.height_cm != null)   setHeightCm(String(profile.height_cm));
      if (profile.current_weight_kg)   setWeightKg(String(profile.current_weight_kg));
      if (profile.goal_weight_kg)      setGoalWeight(String(profile.goal_weight_kg));
      if (profile.goal_type)           setGoalType(profile.goal_type);
      if (profile.activity_level)      setActivityLevel(profile.activity_level);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [profile, hydrated]);

  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(birthYear, 10);
  const heightNum = parseFloat(heightCm);
  const weightNum = parseFloat(weightKg);

  const errors = {
    displayName: !displayName.trim() ? "Necesitamos un nombre" : null,
    birthYear: !birthYear
      ? "Ingresá tu año de nacimiento"
      : yearNum < 1900 || yearNum > currentYear - 10
        ? `Año entre 1900 y ${currentYear - 10}` : null,
    heightCm: !heightCm
      ? "Ingresá tu altura"
      : heightNum < 100 || heightNum > 250 ? "Altura entre 100 y 250 cm" : null,
    weightKg: !weightKg
      ? "Ingresá tu peso"
      : weightNum < 25 || weightNum > 300 ? "Peso entre 25 y 300 kg" : null,
  };
  const personalComplete = !errors.birthYear && !errors.heightCm && !errors.weightKg;
  const canFinish =
    !errors.displayName && personalComplete;

  async function handleFinish() {
    if (!canFinish) return;
    setSaving(true);
    setSaveError(null);
    const birthDate = birthYear ? `${birthYear}-01-01` : undefined;
    const weight = weightKg ? parseFloat(weightKg) : NaN;
    const height = heightCm ? parseFloat(heightCm) : NaN;
    const age = birthYear ? currentYear - yearNum : NaN;

    let kcalTarget: number | undefined;
    let macros: { protein_g: number; carbs_g: number; fat_g: number } | undefined;

    if (Number.isFinite(weight) && Number.isFinite(height) && Number.isFinite(age) && age > 0) {
      const basal = bmr({ weight_kg: weight, height_cm: height, age_years: age, sex });
      kcalTarget = dailyKcalTarget(tdee(basal, activityLevel), goalType);
      macros = defaultMacroTargets(kcalTarget, goalType);
    }

    const { error } = await updateProfile({
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

    if (error) {
      setSaveError("No pudimos guardar tu perfil. Revisá tu conexión e intentá nuevamente.");
      setSaving(false);
      return;
    }

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
              <label htmlFor="onboarding-name" style={labelStyle}>¿Cómo te llamás?</label>
              <input
                id="onboarding-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                style={inputStyle}
                autoFocus
                aria-invalid={!!errors.displayName}
                aria-describedby={errors.displayName ? "onboarding-name-error" : undefined}
              />
              {errors.displayName && (
                <div id="onboarding-name-error" style={fieldErrorStyle}>{errors.displayName}</div>
              )}
            </div>

            <button
              onClick={() => setStep("personal")}
              disabled={!!errors.displayName}
              style={{ ...primaryBtn, marginTop: 24, opacity: errors.displayName ? 0.5 : 1 }}
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
                <label htmlFor="onboarding-birth-year" style={labelStyle}>Año de nacimiento</label>
                <input id="onboarding-birth-year" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="1996" min={1900} max={currentYear - 10} style={inputStyle}
                  aria-invalid={!!errors.birthYear} aria-describedby="onboarding-birth-error" />
                {errors.birthYear && <div id="onboarding-birth-error" style={fieldErrorStyle}>{errors.birthYear}</div>}
              </div>
              <div>
                <div id="onboarding-sex-label" style={labelStyle}>Sexo biológico</div>
                <div role="group" aria-labelledby="onboarding-sex-label" style={{ display: "flex", gap: 8 }}>
                  {(["male", "female", "other"] as Sex[]).map((s) => (
                    <button key={s} onClick={() => setSex(s)} aria-pressed={sex === s} style={{
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
                  <label htmlFor="onboarding-height" style={labelStyle}>Altura (cm)</label>
                  <input id="onboarding-height" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="178" min={100} max={250} style={inputStyle}
                    aria-invalid={!!errors.heightCm} aria-describedby="onboarding-height-error" />
                  {errors.heightCm && <div id="onboarding-height-error" style={fieldErrorStyle}>{errors.heightCm}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="onboarding-weight" style={labelStyle}>Peso actual (kg)</label>
                  <input id="onboarding-weight" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="73.4" step={0.1} min={25} max={300} style={inputStyle}
                    aria-invalid={!!errors.weightKg} aria-describedby="onboarding-weight-error" />
                  {errors.weightKg && <div id="onboarding-weight-error" style={fieldErrorStyle}>{errors.weightKg}</div>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={() => setStep("welcome")} style={secondaryBtn}>← Atrás</button>
              <button
                onClick={() => setStep("goal")}
                disabled={!personalComplete}
                style={{ ...primaryBtn, flex: 1, opacity: personalComplete ? 1 : 0.5 }}
              >Siguiente →</button>
            </div>
          </div>
        )}

        {/* Step: Goal */}
        {step === "goal" && (
          <div>
            <StepHeader current={2} total={3} title="Tu objetivo" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              {GOAL_OPTIONS.map((g) => (
                <button key={g.value} onClick={() => setGoalType(g.value)} aria-pressed={goalType === g.value} style={{
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
                  <label htmlFor="onboarding-goal-weight" style={labelStyle}>Peso objetivo (kg)</label>
                  <input id="onboarding-goal-weight" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
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
                <button key={a.value} onClick={() => setActivityLevel(a.value)} aria-pressed={activityLevel === a.value} style={{
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
              <button
                onClick={handleFinish}
                disabled={saving || !canFinish}
                style={{ ...primaryBtn, flex: 1, opacity: !canFinish || saving ? 0.5 : 1 }}
              >
                {saving ? "Guardando…" : "¡Arrancar! 🚀"}
              </button>
            </div>
            {!canFinish && (
              <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
                Completá nombre, año de nacimiento, altura y peso para arrancar.
              </div>
            )}
            {saveError && (
              <div role="alert" style={{
                marginTop: 12, padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)",
                fontSize: 11.5, color: "var(--red)", textAlign: "center", lineHeight: 1.5,
              }}>
                {saveError}
              </div>
            )}
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

const fieldErrorStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--red)",
  fontSize: 10.5,
  lineHeight: 1.35,
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
