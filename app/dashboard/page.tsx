"use client";

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
} from "@/components/icons";
import { Stat } from "@/components/ui/Stat";
import { Bar } from "@/components/ui/Bar";
import { KILO_DATA, fmtNum } from "@/data/mock";
import { useSheet } from "@/context/SheetContext";

export default function DashboardPage() {
  const { openSheet } = useSheet();
  const D = KILO_DATA;
  const t = D.today;

  return (
    <AppShell>
      <Screen scrollKey="dash">
        {/* Header */}
        <div style={{ padding: "0 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{
              fontSize: 11,
              color: "var(--text-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 4,
              fontFamily: "var(--font-mono)",
            }}>
              {t.date.toUpperCase()}
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "var(--text-1)",
              margin: 0,
              whiteSpace: "nowrap",
            }}>
              Hola, {D.user.name}<span style={{ color: "var(--lime)" }}>.</span>
            </h1>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtn}><IconBell size={18} color="var(--text-2)" /></button>
            <button style={iconBtn}><IconRunner size={18} color="var(--lime)" /></button>
          </div>
        </div>

        {/* Kcal hero */}
        <div style={{ padding: "20px 20px 0" }}>
          <KcalHeroCard kcalLogged={t.kcalLogged} kcalGoal={t.kcalGoal} />
        </div>

        {/* Macro mini cards */}
        <SectionHead title="Macros" action="Detalle →" />
        <MacroMiniCards macros={t.macros} />

        {/* Habits preview */}
        <SectionHead title="Hábitos de hoy" action="Ver todos →" />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <HabitRow
            Icon={IconPill}
            name="Creatina"
            sub="5g · diaria"
            streak={14}
            done
            color="var(--lime)"
          />
          <HabitRow
            Icon={IconDroplet}
            name="Hidratación"
            sub="4 de 8 vasos"
            streak={6}
            done={false}
            color="var(--blue)"
            progress={4 / 8}
          />
        </div>

        {/* Steps + Weight */}
        <div style={{ padding: "16px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Steps */}
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <IconActivity size={18} color="var(--blue)" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
                {Math.round((t.steps / t.stepsGoal) * 100)}%
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <Stat value={fmtNum(t.steps)} size={26} />
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4, marginBottom: 10 }}>
              pasos / meta {fmtNum(t.stepsGoal)}
            </div>
            <Bar value={t.steps} max={t.stepsGoal} color="var(--blue)" height={4} />
          </div>

          {/* Weight */}
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <IconScale size={18} color="var(--lime)" />
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--lime)",
              }}>
                <IconArrowDown size={10} color="var(--lime)" />0.6
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <Stat value="73.4" unit="kg" size={26} />
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4, marginBottom: 8 }}>
              peso · 7 días
            </div>
            <WeightSpark data={D.weightHistory} />
          </div>
        </div>

        {/* Meals */}
        <SectionHead title="Hoy comí" action="Ver diario →" />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {D.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onAdd={() => openSheet(meal.id)} />
          ))}
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}

const iconBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "var(--bg-1)",
  border: "1px solid var(--line-1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
