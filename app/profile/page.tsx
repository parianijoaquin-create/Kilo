"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { Stat } from "@/components/ui/Stat";
import {
  IconRunner, IconTarget, IconBell, IconScale,
  IconSettings, IconChevronRight,
} from "@/components/icons";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeightLog } from "@/hooks/useWeightLog";

const SETTINGS_BASE = [
  { Icon: IconTarget,   label: "Objetivos y macros" },
  { Icon: IconBell,     label: "Recordatorios",      detail: "—"     },
  { Icon: IconScale,    label: "Unidades"                            },
  { Icon: IconSettings, label: "Preferencias"                        },
];

function ageFromBirthDate(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { latestWeight, logWeight, saving, sparkData } = useWeightLog();

  const displayName = profile?.display_name ?? "…";
  const displayWeight = latestWeight ?? profile?.current_weight_kg;
  const age = ageFromBirthDate(profile?.birth_date);
  const goalLabel: Record<string, string> = {
    lose: "PERDER PESO",
    maintain: "MANTENIMIENTO",
    gain: "GANAR MASA",
    recomp: "RECOMPOSICIÓN",
  };
  const goalTag = profile?.goal_type ? (goalLabel[profile.goal_type] ?? profile.goal_type.toUpperCase()) : "OBJETIVO NO DEFINIDO";

  const remainingKg = profile?.goal_weight_kg != null && displayWeight != null
    ? Math.round((displayWeight - profile.goal_weight_kg) * 10) / 10
    : null;

  const otherStats = [
    {
      l: "Meta", u: "kg",
      value: profile?.goal_weight_kg != null ? String(profile.goal_weight_kg) : "–",
      delta: remainingKg != null ? `${remainingKg > 0 ? "−" : "+"}${Math.abs(remainingKg)} a ir` : "definí meta",
    },
    {
      l: "Registros peso", u: "",
      value: String(sparkData.length),
      delta: sparkData.length > 0 ? "registrados" : "registrá tu peso",
    },
    {
      l: "Altura", u: "cm",
      value: profile?.height_cm != null ? String(profile.height_cm) : "–",
      delta: profile?.activity_level ?? "—",
    },
  ];

  const settingsRows = [
    { ...SETTINGS_BASE[0], detail: profile?.daily_target_kcal ? `${profile.daily_target_kcal} kcal` : "definir" },
    SETTINGS_BASE[1],
    { ...SETTINGS_BASE[2], detail: profile?.unit_system === "imperial" ? "lb · in" : "kg · cm" },
    { ...SETTINGS_BASE[3], detail: profile?.locale ?? "es-AR" },
  ];

  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function saveWeight() {
    const kg = parseFloat(weightInput.replace(",", "."));
    if (!weightInput || isNaN(kg) || kg <= 0) return;

    const { error } = await logWeight(kg);
    if (!error) {
      setEditingWeight(false);
      setWeightInput("");
      setSavedMsg(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSavedMsg(false), 2500);
    }
  }

  function openEdit() {
    setWeightInput(displayWeight != null ? String(displayWeight) : "");
    setEditingWeight(true);
  }

  return (
    <AppShell>
      <Screen scrollKey="profile">
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500,
            letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0,
          }}>
            Perfil
          </h1>
        </div>

        {/* User card */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{
            background: "linear-gradient(160deg, rgba(198,255,80,0.08) 0%, var(--bg-1) 60%)",
            border: "1px solid rgba(198,255,80,0.2)",
            borderRadius: 22, padding: 20,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 22,
              background: "rgba(198,255,80,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconRunner size={32} color="var(--lime)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text-1)" }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)", letterSpacing: "0.01em" }}>
                {age != null ? `${age} años · ` : ""}{profile?.height_cm != null ? `${profile.height_cm}cm` : "–"}{displayWeight != null ? ` · ${displayWeight}kg` : ""}
              </div>
              <div style={{
                marginTop: 8, display: "inline-flex", gap: 4,
                padding: "3px 10px",
                background: "rgba(198,255,80,0.12)",
                borderRadius: 100,
                fontSize: 10, color: "var(--lime)", fontWeight: 600,
                fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
              }}>
                OBJETIVO: {goalTag}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: "12px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* ── Peso actual: clickeable para registrar nuevo peso ── */}
          <div
            onClick={!editingWeight ? openEdit : undefined}
            className={!editingWeight ? "kilo-pressable" : undefined}
            style={{
              background: "var(--bg-1)",
              border: `1px solid ${editingWeight ? "var(--lime)" : "var(--line-1)"}`,
              borderRadius: 16,
              padding: 14,
              cursor: !editingWeight ? "pointer" : "default",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              Peso actual
            </div>

            {!editingWeight ? (
              <>
                <div style={{ marginTop: 8 }}>
                  <Stat value={displayWeight != null ? String(displayWeight) : "–"} unit="kg" size={24} />
                </div>
                <div style={{ fontSize: 11, color: "var(--lime)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  {savedMsg ? "✓ guardado" : "↓ registrar"}
                </div>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveWeight();
                    if (e.key === "Escape") { setEditingWeight(false); setWeightInput(""); }
                  }}
                  placeholder="73.4"
                  step="0.1"
                  min="1"
                  style={{
                    marginTop: 8,
                    width: "100%",
                    background: "var(--bg-2)",
                    border: "1px solid var(--lime)",
                    borderRadius: 8,
                    color: "var(--text-1)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 18,
                    fontWeight: 600,
                    padding: "4px 8px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); saveWeight(); }}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      background: "var(--lime)",
                      border: "none",
                      borderRadius: 7,
                      color: "#0a0d15",
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {saving ? "…" : "GUARDAR"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingWeight(false); setWeightInput(""); }}
                    style={{
                      padding: "5px 10px",
                      background: "transparent",
                      border: "1px solid var(--line-2)",
                      borderRadius: 7,
                      color: "var(--text-3)",
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Resto de stats (hardcoded) ── */}
          {otherStats.map((s) => (
            <div key={s.l} style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {s.l}
              </div>
              <div style={{ marginTop: 8 }}>
                <Stat value={s.value} unit={s.u} size={24} />
              </div>
              <div style={{ fontSize: 11, color: "var(--lime)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                {s.delta}
              </div>
            </div>
          ))}

        </div>

        {/* Settings list */}
        <SectionHead title="Configuración" />
        <div style={{ padding: "0 20px" }}>
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, overflow: "hidden" }}>
            {settingsRows.map((r, i) => {
              const href = i === 0 ? "/onboarding" : i === 1 ? "/profile/reminders" : null;
              return (
                <button
                  key={r.label}
                  onClick={href ? () => router.push(href) : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", width: "100%",
                    background: "none", border: "none",
                    borderBottom: i < settingsRows.length - 1 ? "0.5px solid var(--line-1)" : "none",
                    cursor: href ? "pointer" : "default",
                    opacity: href ? 1 : 0.5,
                    textAlign: "left",
                    minHeight: 44,
                  }}
                >
                  <r.Icon size={20} color="var(--text-2)" />
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-1)", fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{r.detail}</span>
                  <IconChevronRight size={16} color="var(--text-3)" />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => router.push("/onboarding")}
            className="kilo-pressable"
            style={{
              width: "100%", padding: "12px",
              background: "var(--bg-1)", border: "1px solid var(--line-1)",
              borderRadius: 14, color: "var(--text-2)",
              fontSize: 12.5, cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            ↺ Volver a empezar (onboarding)
          </button>
          <button
            onClick={signOut}
            className="kilo-pressable"
            style={{
              width: "100%", padding: "12px",
              background: "rgba(255,107,107,0.06)",
              border: "1px solid rgba(255,107,107,0.2)",
              borderRadius: 14, color: "var(--red)",
              fontSize: 12.5, cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600,
            }}
          >
            Cerrar sesión
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 30, fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.05em", color: "var(--text-3)", opacity: 0.4 }}>
          kilo<span style={{ color: "var(--lime)" }}>.</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-3)", letterSpacing: "0.1em" }}>
          v1.0 · BUILD 2026.05
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}
