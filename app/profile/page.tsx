"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { Stat } from "@/components/ui/Stat";
import {
  IconRunner, IconTarget, IconBell, IconScale,
  IconSettings, IconChevronRight,
} from "@/components/icons";
import { KILO_DATA } from "@/data/mock";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const STATS = [
  { l: "Peso actual", v: "73.4", u: "kg",    delta: "−0.6"      },
  { l: "Meta",        v: "70.0", u: "kg",    delta: "−3.4 a ir" },
  { l: "Racha máx.",  v: "21",   u: "días",  delta: "creatina"  },
  { l: "Total días",  v: "47",   u: "",      delta: "en Kilo"   },
];

const SETTINGS_ROWS = [
  { Icon: IconTarget,   label: "Objetivos y macros", detail: "2.400 kcal · −400" },
  { Icon: IconBell,     label: "Recordatorios",      detail: "3 activos"         },
  { Icon: IconScale,    label: "Unidades",            detail: "kg · cm"           },
  { Icon: IconSettings, label: "Preferencias",        detail: "es-AR"             },
];

export default function ProfilePage() {
  const D = KILO_DATA;
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const displayName = profile?.display_name || D.user.name;

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
                {D.user.age} años · {D.user.height}cm · {D.user.weight}kg
              </div>
              <div style={{
                marginTop: 8, display: "inline-flex", gap: 4,
                padding: "3px 10px",
                background: "rgba(198,255,80,0.12)",
                borderRadius: 100,
                fontSize: 10, color: "var(--lime)", fontWeight: 600,
                fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
              }}>
                OBJETIVO: DEFINIR
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: "12px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {STATS.map((s) => (
            <div key={s.l} style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {s.l}
              </div>
              <div style={{ marginTop: 8 }}>
                <Stat value={s.v} unit={s.u} size={24} />
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
            {SETTINGS_ROWS.map((r, i) => (
              <button key={r.label} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", width: "100%",
                background: "none", border: "none",
                borderBottom: i < SETTINGS_ROWS.length - 1 ? "0.5px solid var(--line-1)" : "none",
                cursor: "pointer", textAlign: "left",
                minHeight: 44,
              }}>
                <r.Icon size={20} color="var(--text-2)" />
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-1)", fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{r.detail}</span>
                <IconChevronRight size={16} color="var(--text-3)" />
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={{
            width: "100%", padding: "12px",
            background: "var(--bg-1)", border: "1px solid var(--line-1)",
            borderRadius: 14, color: "var(--text-2)",
            fontSize: 12.5, cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}>
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

        {/* Kilo wordmark */}
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
