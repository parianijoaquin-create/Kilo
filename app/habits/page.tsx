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
import { useHabits } from "@/hooks/useHabits";
import type { Habit, HabitColor } from "@/types";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const ROTATING_COLORS: HabitColor[] = ["lime", "blue", "violet", "orange", "red"];

const HABIT_COLOR_MAP: Record<HabitColor, { c: string; bg: string }> = {
  lime:   { c: "var(--lime)",   bg: "rgba(198,255,80,0.15)" },
  blue:   { c: "var(--blue)",   bg: "rgba(91,141,239,0.18)" },
  violet: { c: "var(--violet)", bg: "rgba(157,124,255,0.18)" },
  orange: { c: "var(--orange)", bg: "rgba(255,165,80,0.18)" },
  red:    { c: "var(--red)",    bg: "rgba(255,107,107,0.18)" },
};

function iconFromCode(code: string | undefined) {
  const k = (code ?? "").toLowerCase();
  if (k.includes("creatina") || k.includes("pill") || k.includes("vitamin")) return IconPill;
  if (k.includes("water") || k.includes("hidrat") || k.includes("agua")) return IconDroplet;
  if (k.includes("sleep") || k.includes("sueño") || k.includes("sueno")) return IconMoon;
  if (k.includes("walk") || k.includes("camin")) return IconRunner;
  if (k.includes("stretch") || k.includes("estirar")) return IconActivity;
  return IconLeaf;
}

// Returns Mon=0..Sun=6 index for a Date
function weekIndex(d: Date) {
  const day = d.getDay(); // Sun=0..Sat=6
  return (day + 6) % 7;   // Mon=0..Sun=6
}

function ymd(d: Date) {
  return d.toISOString().split("T")[0];
}

function buildWeekDates() {
  const now = new Date();
  const idx = weekIndex(now);
  const monday = new Date(now);
  monday.setDate(now.getDate() - idx);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

interface HabitView {
  id: string;
  name: string;
  dose: string;
  Icon: typeof IconPill;
  palette: { c: string; bg: string };
  streak: number;
  weekDone: boolean[];
  todayIdx: number;
  doneToday: boolean;
  rawTargetValue: number | null;
  rawTargetUnit: string | null;
}

function buildHabitView(habit: Habit, indexInList: number, week: Date[]): HabitView {
  const colorKey = ROTATING_COLORS[indexInList % ROTATING_COLORS.length];
  const palette = HABIT_COLOR_MAP[colorKey];
  const Icon = iconFromCode(habit.code ?? habit.title);
  const logs = habit.habit_logs ?? [];
  const doneByDate = new Set(logs.filter((l) => l.status === "done").map((l) => l.log_date));
  const weekDone = week.map((d) => doneByDate.has(ymd(d)));
  const todayIdx = weekIndex(new Date());
  const doneToday = weekDone[todayIdx];

  // Streak: walk back from today
  let streak = 0;
  const cursor = new Date();
  while (doneByDate.has(ymd(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const dose = habit.target_value != null
    ? `${habit.target_value}${habit.target_unit ? " " + habit.target_unit : ""}`
    : habit.frequency === "daily" ? "diario" : habit.frequency;

  return {
    id: habit.id, name: habit.title, dose, Icon, palette, streak, weekDone, todayIdx, doneToday,
    rawTargetValue: habit.target_value ?? null,
    rawTargetUnit: habit.target_unit ?? null,
  };
}

function HabitCard({ habit, onToggle, onDelete, onEdit }: { habit: HabitView; onToggle: () => void; onDelete: () => void; onEdit: () => void }) {
  const { palette, Icon } = habit;
  const gradBg = habit.doneToday
    ? `linear-gradient(140deg, ${palette.bg.replace("0.15", "0.06").replace("0.18", "0.06")} 0%, var(--bg-1) 60%)`
    : "var(--bg-1)";

  return (
    <div style={{
      background: gradBg,
      border: habit.doneToday ? `1px solid ${palette.c}44` : "1px solid var(--line-1)",
      borderRadius: 20, padding: 16,
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2 }}>
        <button
          onClick={onEdit}
          aria-label="Editar hábito"
          style={{
            width: 24, height: 24,
            background: "transparent",
            border: "none",
            color: "var(--text-3)",
            fontSize: 12,
            cursor: "pointer",
            lineHeight: 1,
            opacity: 0.5,
          }}
        >
          ✎
        </button>
        <button
          onClick={() => {
            if (window.confirm(`¿Borrar el hábito "${habit.name}"?`)) onDelete();
          }}
          aria-label="Borrar hábito"
          style={{
            width: 24, height: 24,
            background: "transparent",
            border: "none",
            color: "var(--text-3)",
            fontSize: 14,
            cursor: "pointer",
            lineHeight: 1,
            opacity: 0.5,
          }}
        >
          ×
        </button>
      </div>
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

interface HabitFormValues {
  title: string;
  target_value?: number;
  target_unit?: string;
}

function HabitForm({ mode, initial, onSubmit, onCancel }: {
  mode: "create" | "edit";
  initial?: { title?: string; target_value?: number | null; target_unit?: string | null };
  onSubmit: (data: HabitFormValues) => Promise<{ error: string | null }>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [target, setTarget] = useState(initial?.target_value != null ? String(initial.target_value) : "");
  const [unit, setUnit] = useState(initial?.target_unit ?? "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    const { error } = await onSubmit({
      title: title.trim(),
      target_value: target ? Number(target) : undefined,
      target_unit: unit.trim() || undefined,
    });
    setSaving(false);
    if (error) setErrorMsg(error);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    background: "var(--bg-2)", border: "1px solid var(--line-2)",
    borderRadius: 10, color: "var(--text-1)",
    fontSize: 13.5, fontFamily: "var(--font-body)", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={submit} style={{
      background: "var(--bg-1)", border: "1px solid var(--lime)",
      borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nombre del hábito (ej. Creatina)"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="Cantidad (opcional)"
          inputMode="decimal"
          style={{ ...inputStyle, flex: 2 }}
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unidad"
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          style={{
            flex: 1, padding: "10px 0",
            background: "var(--lime)", border: "none",
            borderRadius: 10, color: "#0a0d15",
            fontSize: 12.5, fontWeight: 700,
            cursor: saving || !title.trim() ? "default" : "pointer",
            opacity: saving || !title.trim() ? 0.55 : 1,
          }}
        >
          {saving ? "Guardando…" : mode === "edit" ? "Guardar cambios" : "Crear"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "10px 16px",
            background: "transparent", border: "1px solid var(--line-2)",
            borderRadius: 10, color: "var(--text-3)",
            fontSize: 12.5, cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
      {errorMsg && (
        <div style={{
          marginTop: 2,
          padding: "8px 10px",
          background: "rgba(255,107,107,0.08)",
          border: "1px solid rgba(255,107,107,0.3)",
          borderRadius: 8,
          fontSize: 11.5,
          color: "var(--red)",
          fontFamily: "var(--font-mono)",
          lineHeight: 1.4,
        }}>
          {errorMsg}
        </div>
      )}
    </form>
  );
}

export default function HabitsPage() {
  const { habits, toggleHabit, createHabit, deleteHabit, updateHabit, loading } = useHabits();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const week = buildWeekDates();
  const views = habits.map((h, i) => buildHabitView(h, i, week));

  const totalToday = views.length;
  const doneTodayCount = views.filter((v) => v.doneToday).length;
  const maxStreak = views.reduce((m, v) => Math.max(m, v.streak), 0);

  const weekRange = (() => {
    const first = week[0];
    const last = week[6];
    const sameMonth = first.getMonth() === last.getMonth();
    const m = (d: Date) => d.toLocaleDateString("es-AR", { month: "long" });
    return sameMonth
      ? `${first.getDate()} – ${last.getDate()} ${m(last)}`
      : `${first.getDate()} ${m(first)} – ${last.getDate()} ${m(last)}`;
  })();

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
            {loading
              ? "Cargando…"
              : totalToday === 0
                ? "Creá tu primer hábito"
                : <>Hoy: <span style={{ color: "var(--lime)" }}>{doneTodayCount} de {totalToday}</span></>}
          </div>
        </div>

        {/* Weekly heatmap */}
        {views.length > 0 && (
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 18, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    SEMANA
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text-1)", marginTop: 2 }}>
                    {weekRange}
                  </div>
                </div>
                {maxStreak > 0 && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px",
                    background: "rgba(198,255,80,0.12)", border: "0.5px solid rgba(198,255,80,0.3)",
                    borderRadius: 100, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--lime)", fontWeight: 600,
                  }}>
                    <IconFlame size={12} color="var(--lime)" /> {maxStreak} días
                  </div>
                )}
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
              {views.map((h) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, background: h.palette.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <h.Icon size={12} color={h.palette.c} />
                  </div>
                  {h.weekDone.map((done, i) => {
                    const isToday = i === h.todayIdx;
                    return (
                      <div key={i} style={{
                        flex: 1, aspectRatio: "1/1", borderRadius: 7,
                        background: done ? h.palette.c : "var(--bg-2)",
                        border: isToday && !done ? `1.5px dashed ${h.palette.c}` : "none",
                        opacity: done ? 1 : i > h.todayIdx ? 0.35 : 0.6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {done && <IconCheck size={10} color="#0a0d15" strokeWidth={3} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habit cards */}
        <SectionHead title="Tus hábitos" />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {views.map((h) =>
            editingId === h.id ? (
              <HabitForm
                key={h.id}
                mode="edit"
                initial={{ title: h.name, target_value: h.rawTargetValue, target_unit: h.rawTargetUnit }}
                onSubmit={async (data) => {
                  const res = await updateHabit(h.id, {
                    title: data.title,
                    target_value: data.target_value ?? null,
                    target_unit: data.target_unit ?? null,
                  });
                  if (!res.error) setEditingId(null);
                  return res;
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={() => toggleHabit(h.id)}
                onDelete={() => deleteHabit(h.id)}
                onEdit={() => setEditingId(h.id)}
              />
            )
          )}

          {creating ? (
            <HabitForm
              mode="create"
              onSubmit={async (data) => {
                const res = await createHabit({
                  ...data,
                  code: data.title.toLowerCase().replace(/\s+/g, "_").slice(0, 32),
                  frequency: "daily",
                });
                if (!res.error) setCreating(false);
                return res;
              }}
              onCancel={() => setCreating(false)}
            />
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="kilo-pressable"
              style={{
                background: "transparent", border: "1.5px dashed var(--line-2)",
                borderRadius: 20, padding: 16,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                width: "100%", textAlign: "left",
              }}
            >
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
          )}
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
