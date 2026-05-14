"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { MultiRing } from "@/components/ui/MultiRing";
import { Bar } from "@/components/ui/Bar";
import { KILO_DATA, fmtNum } from "@/data/mock";

interface MacroInfo {
  key: string;
  label: string;
  subtitle: string;
  cur: number;
  goal: number;
  code: string;
  color: string;
  tip: string;
  kcalPerG: number;
}

function MacroDetailCard({ macro: m }: { macro: MacroInfo }) {
  const remaining = m.goal - m.cur;
  const pct = Math.round((m.cur / m.goal) * 100);
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
        <span style={{ color: m.color, fontWeight: 600 }}>Faltan {remaining}g.</span>{" "}{m.tip}
      </div>
    </div>
  );
}

function DistributionBar({ macros }: { macros: MacroInfo[] }) {
  const totalKcal = macros.reduce((s, m) => s + m.cur * m.kcalPerG, 0);
  return (
    <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: "var(--bg-2)" }}>
      {macros.map((m) => (
        <div key={m.key} style={{ width: `${(m.cur * m.kcalPerG / totalKcal) * 100}%`, background: m.color }} />
      ))}
    </div>
  );
}

export default function MacrosPage() {
  const t = KILO_DATA.today;
  const totalKcal = t.kcalLogged;
  const remaining = t.kcalGoal - totalKcal;

  const macros: MacroInfo[] = [
    {
      key: "protein", label: "Proteína", subtitle: "Músculo · recuperación",
      cur: t.macros.protein.current, goal: t.macros.protein.goal, code: "P",
      color: "var(--lime)", tip: "Te faltan 42g — equivale a 200g de pollo o 6 claras de huevo.",
      kcalPerG: 4,
    },
    {
      key: "carbs", label: "Carbohidratos", subtitle: "Energía · rendimiento",
      cur: t.macros.carbs.current, goal: t.macros.carbs.goal, code: "C",
      color: "var(--blue)", tip: "Te faltan 151g — sumá arroz + fruta en la cena y cerrás.",
      kcalPerG: 4,
    },
    {
      key: "fat", label: "Grasas", subtitle: "Hormonas · saciedad",
      cur: t.macros.fat.current, goal: t.macros.fat.goal, code: "G",
      color: "var(--orange)", tip: "Casi cubierto. 13g = un puñado de maní o ¼ palta.",
      kcalPerG: 9,
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
            Distribución de tus {fmtNum(t.kcalGoal)} kcal · objetivo definición
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
                  {Math.round((totalKcal / t.kcalGoal) * 100)}
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
                const pct = Math.round((kcal / totalKcal) * 100);
                return (
                  <div key={m.key} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em", color: m.color, lineHeight: 1 }}>
                      {pct}<span style={{ fontSize: 11, color: "var(--text-3)" }}>%</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      {kcal} KCAL
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
