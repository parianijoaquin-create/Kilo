"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { MultiRing } from "@/components/ui/MultiRing";
import { Bar } from "@/components/ui/Bar";
import { useDiary } from "@/hooks/useDiary";
import { useProfile } from "@/hooks/useProfile";

interface MacroInfo {
  key: string;
  label: string;
  subtitle: string;
  cur: number;
  goal: number;
  code: string;
  color: string;
  kcalPerG: number;
}

const fmtNum = (n: number) => n.toLocaleString("es-AR");

function tipFor(key: string, remaining: number) {
  if (remaining <= 0) return "Meta cubierta — buen trabajo.";
  if (key === "protein") return `Sumá ${remaining}g — equivale a ${Math.round(remaining / 0.22)}g de pollo o ${Math.round(remaining / 6)} claras de huevo.`;
  if (key === "carbs")   return `Sumá ${remaining}g — una taza de arroz cocido aporta ~55g.`;
  return `Sumá ${remaining}g — un puñado de maní (~28g) aporta ~14g de grasa.`;
}

function MacroDetailCard({ macro: m }: { macro: MacroInfo }) {
  const remaining = Math.max(0, m.goal - m.cur);
  const pct = m.goal > 0 ? Math.round((m.cur / m.goal) * 100) : 0;
  return (
    <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${m.color}1f`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: m.color,
        }}>
          {m.code}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
            {m.label}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{m.subtitle}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.03em", color: m.color, lineHeight: 1 }}>
            {m.cur}<span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 400 }}>/{m.goal}g</span>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
            {pct}% META
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Bar value={m.cur} max={m.goal} color={m.color} height={6} glow />
      </div>
      <div style={{
        marginTop: 12, padding: "10px 12px",
        background: "rgba(255,255,255,0.02)",
        borderLeft: `2px solid ${m.color}`,
        borderRadius: "0 8px 8px 0",
        fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.5,
      }}>
        <span style={{ color: m.color, fontWeight: 600 }}>
          {remaining > 0 ? `Faltan ${remaining}g.` : "Meta cubierta."}
        </span>{" "}{tipFor(m.key, remaining)}
      </div>
    </div>
  );
}

function DistributionBar({ macros }: { macros: MacroInfo[] }) {
  const totalKcal = macros.reduce((s, m) => s + m.cur * m.kcalPerG, 0);
  if (totalKcal <= 0) {
    return <div style={{ height: 10, borderRadius: 6, background: "var(--bg-2)" }} />;
  }
  return (
    <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: "var(--bg-2)" }}>
      {macros.map((m) => (
        <div key={m.key} style={{ width: `${(m.cur * m.kcalPerG / totalKcal) * 100}%`, background: m.color }} />
      ))}
    </div>
  );
}

export default function MacrosPage() {
  const { totals } = useDiary();
  const { profile } = useProfile();

  const kcalGoal    = profile?.daily_target_kcal ?? 2000;
  const proteinGoal = profile?.protein_target_g  ?? 150;
  const carbsGoal   = profile?.carbs_target_g    ?? 200;
  const fatGoal     = profile?.fat_target_g      ?? 65;

  const totalKcal = Math.round(totals.kcal);
  const remaining = Math.max(0, kcalGoal - totalKcal);

  const macros: MacroInfo[] = [
    {
      key: "protein", label: "Proteína", subtitle: "Músculo · recuperación",
      cur: Math.round(totals.protein), goal: Math.round(proteinGoal), code: "P",
      color: "var(--lime)", kcalPerG: 4,
    },
    {
      key: "carbs", label: "Carbohidratos", subtitle: "Energía · rendimiento",
      cur: Math.round(totals.carbs), goal: Math.round(carbsGoal), code: "C",
      color: "var(--blue)", kcalPerG: 4,
    },
    {
      key: "fat", label: "Grasas", subtitle: "Hormonas · saciedad",
      cur: Math.round(totals.fat), goal: Math.round(fatGoal), code: "G",
      color: "var(--orange)", kcalPerG: 9,
    },
  ];

  return (
    <AppShell>
      <Screen scrollKey="macros">
        {/* Header */}
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500,
            letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0,
          }}>
            Macronutrientes
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            Distribución de tus {fmtNum(kcalGoal)} kcal · {profile?.goal_type ?? "—"}
          </div>
        </div>

        {/* Hero ring */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{
            background: "linear-gradient(160deg, rgba(198,255,80,0.06) 0%, var(--bg-1) 60%)",
            border: "1px solid rgba(198,255,80,0.18)",
            borderRadius: 24, padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <MultiRing size={130} stroke={14} segments={macros.map((m) => ({ color: m.color, value: m.cur, max: m.goal }))}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500,
                  letterSpacing: "-0.04em", color: "var(--text-1)", lineHeight: 1,
                }}>
                  {kcalGoal > 0 ? Math.round((totalKcal / kcalGoal) * 100) : 0}
                  <span style={{ fontSize: 14, color: "var(--text-3)" }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                  OBJETIVO
                </div>
              </MultiRing>
              <div style={{ flex: 1 }}>
                {macros.map((m) => (
                  <div key={m.key} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 0",
                    borderBottom: "0.5px solid var(--line-1)",
                  }}>
                    <span style={{ width: 4, height: 18, borderRadius: 2, background: m.color }} />
                    <span style={{ fontSize: 11.5, color: "var(--text-2)", flex: 1 }}>{m.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-1)", fontWeight: 600 }}>
                      {m.cur}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>g</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--lime)", letterSpacing: "-0.02em" }}>
                {fmtNum(remaining)}
              </span>
              <span>kcal restantes hoy</span>
            </div>
          </div>
        </div>

        {/* Macro detail cards */}
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {macros.map((m) => <MacroDetailCard key={m.key} macro={m} />)}
        </div>

        {/* Distribution */}
        <SectionHead title="Distribución calórica" />
        <div style={{ padding: "0 20px" }}>
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 16 }}>
            <DistributionBar macros={macros} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              {macros.map((m) => {
                const kcal = m.cur * m.kcalPerG;
                const pct = totalKcal > 0 ? Math.round((kcal / totalKcal) * 100) : 0;
                return (
                  <div key={m.key} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em", color: m.color, lineHeight: 1 }}>
                      {pct}<span style={{ fontSize: 11, color: "var(--text-3)" }}>%</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      {Math.round(kcal)} KCAL
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}
