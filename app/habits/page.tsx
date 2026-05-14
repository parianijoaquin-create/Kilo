"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import {
  IconFlame, IconCheck, IconPlus,
  IconPill, IconDroplet, IconMoon,
  IconLeaf, IconActivity, IconRunner,
} from "@/components/icons";
import { KILO_DATA } from "@/data/mock";
import type { MockHabit } from "@/types";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const HABIT_ICON_MAP: Record<string, typeof IconPill> = {
  creatina: IconPill,
  water: IconDroplet,
  sleep: IconMoon,
};

const HABIT_COLOR_MAP: Record<string, { c: string; bg: string }> = {
  lime:   { c: "var(--lime)",   bg: "rgba(198,255,80,0.15)" },
  blue:   { c: "var(--blue)",   bg: "rgba(91,141,239,0.18)" },
  violet: { c: "var(--violet)", bg: "rgba(157,124,255,0.18)" },
};

function HabitCard({ habit, onToggle }: { habit: MockHabit; onToggle: () => void }) {
  const palette = HABIT_COLOR_MAP[habit.color] ?? HABIT_COLOR_MAP.lime;
  const Icon = HABIT_ICON_MAP[habit.id] ?? IconPill;
  const gradBg = habit.doneToday
    ? `linear-gradient(140deg, ${palette.bg.replace("0.15", "0.06").replace("0.18", "0.06")} 0%, var(--bg-1) 60%)`
    : "var(--bg-1)";

  return (
    <div style={{
      background: gradBg,
      border: habit.doneToday ? `1px solid ${palette.c}44` : "1px solid var(--line-1)",
      borderRadius: 20, padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: palette.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={22} color={palette.c} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
            {habit.name}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{habit.dose}</div>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "6px 10px", background: "var(--bg-2)", borderRadius: 12, minWidth: 52,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontFamily: "var(--font-display)", fontWeight: 600, color: palette.c, letterSpacing: "-0.03em" }}>
            <IconFlame size={12} color={palette.c} />
            <span style={{ fontSize: 17 }}>{habit.streak}</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: "var(--text-3)", letterSpacing: "0.08em", fontWeight: 600 }}>
            DÍAS
          </div>
        </div>
        <button
          onClick={onToggle}
          className="kilo-pressable"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: habit.doneToday ? palette.c : "transparent",
            border: habit.doneToday ? "none" : "1.5px solid var(--line-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {habit.doneToday && <IconCheck size={18} color="#0a0d15" strokeWidth={2.5} />}
        </button>
      </div>

      {/* week dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        {habit.weekDone.map((done, i) => {
          const isToday = i === habit.todayIdx;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9,
                color: isToday ? palette.c : "var(--text-3)",
                letterSpacing: "0.05em", fontWeight: 600,
              }}>
                {DAYS[i]}
              </span>
              <div style={{
                width: "100%", height: 6, borderRadius: 3,
                background: done ? palette.c : "var(--bg-2)",
                border: isToday && !done ? `1px dashed ${palette.c}` : "none",
                opacity: i > habit.todayIdx ? 0.35 : 1,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const D = KILO_DATA;
  const [habits, setHabits] = useState(D.habits);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, doneToday: !h.doneToday } : h))
    );
  };

  return (
    <AppShell>
      <Screen scrollKey="habits">
        {/* Header */}
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500,
            letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0,
          }}>
            Hábitos
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            Esta semana: <span style={{ color: "var(--lime)" }}>3 de 3 al día</span> · sigamos así
          </div>
        </div>

        {/* Weekly heatmap */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  SEMANA
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text-1)", marginTop: 2 }}>
                  9 – 15 mayo
                </div>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px",
                background: "rgba(198,255,80,0.12)", border: "0.5px solid rgba(198,255,80,0.3)",
                borderRadius: 100, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--lime)", fontWeight: 600,
              }}>
                <IconFlame size={12} color="var(--lime)" /> 14 días
              </div>
            </div>

            {/* day labels */}
            <div style={{ display: "flex", gap: 6, marginLeft: 28 }}>
              {DAYS.map((d, i) => (
                <div key={i} style={{
                  flex: 1, fontSize: 10, color: "var(--text-3)",
                  fontFamily: "var(--font-mono)", letterSpacing: "0.05em",
                  textAlign: "center", textTransform: "uppercase", fontWeight: 600,
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* heatmap rows */}
            {habits.map((h) => {
              const palette = HABIT_COLOR_MAP[h.color] ?? HABIT_COLOR_MAP.lime;
              const Icon = HABIT_ICON_MAP[h.id] ?? IconPill;
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, background: palette.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={12} color={palette.c} />
                  </div>
                  {h.weekDone.map((done, i) => {
                    const isToday = i === h.todayIdx;
                    return (
                      <div key={i} style={{
                        flex: 1, aspectRatio: "1/1", borderRadius: 7,
                        background: done ? palette.c : "var(--bg-2)",
                        border: isToday && !done ? `1.5px dashed ${palette.c}` : "none",
                        opacity: done ? 1 : i > h.todayIdx ? 0.35 : 0.6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {done && <IconCheck size={10} color="#0a0d15" strokeWidth={3} />}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit cards */}
        <SectionHead title="Tus hábitos" />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} onToggle={() => toggleHabit(h.id)} />
          ))}

          {/* Add habit button */}
          <button style={{
            background: "transparent", border: "1.5px dashed var(--line-2)",
            borderRadius: 20, padding: 16,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
            width: "100%", textAlign: "left",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: "var(--bg-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconPlus size={20} color="var(--text-2)" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--text-2)" }}>
                Nuevo hábito
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                meditar, leer, estiramientos…
              </div>
            </div>
          </button>
        </div>

        {/* Suggestions */}
        <SectionHead title="Sugerencias" />
        <div style={{ padding: "0 20px", display: "flex", gap: 8, overflowX: "auto" }}>
          {[
            { name: "Meditación", sub: "5 min",       Icon: IconLeaf,     color: "#5BD9A3" },
            { name: "Estirar",    sub: "10 min",       Icon: IconActivity, color: "var(--orange)" },
            { name: "Caminar",    sub: "8.000 pasos",  Icon: IconRunner,   color: "var(--blue)" },
          ].map((s, i) => (
            <div key={i} className="kilo-pressable" style={{
              flexShrink: 0, width: 140,
              background: "var(--bg-1)", border: "1px solid var(--line-1)",
              borderRadius: 16, padding: 14, cursor: "pointer",
            }}>
              <s.Icon size={20} color={s.color} />
              <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--text-1)" }}>
                {s.name}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 20 }} />
      </Screen>
    </AppShell>
  );
}
