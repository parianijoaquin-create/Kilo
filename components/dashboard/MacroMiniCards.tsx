"use client";

import { Bar } from "@/components/ui/Bar";
import type { NutritionSummary } from "@/types";

interface MacroMiniCardsProps {
  macros: NutritionSummary;
  onClick?: () => void;
}

const MACRO_COLORS = {
  protein: "var(--lime)",
  carbs: "var(--blue)",
  fat: "var(--orange)",
} as const;

export function MacroMiniCards({ macros, onClick }: MacroMiniCardsProps) {
  return (
    <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {(Object.entries(macros) as [keyof typeof MACRO_COLORS, (typeof macros)[keyof typeof macros]][]).map(
        ([key, m]) => {
          const color = MACRO_COLORS[key];
          const remaining = m.goal - m.current;
          return (
            <div
              key={key}
              onClick={onClick}
              className="kilo-pressable"
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--line-1)",
                borderRadius: 18,
                padding: 14,
                cursor: onClick ? "pointer" : "default",
              }}
            >
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 7,
                background: `${color}1f`,
                color,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 11,
                marginBottom: 10,
              }}>
                {m.code}
              </div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 500,
                color: "var(--text-1)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}>
                {m.current}
                <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}>/{m.goal}g</span>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", margin: "4px 0 10px", letterSpacing: "-0.005em" }}>
                {m.label}
              </div>
              <Bar value={m.current} max={m.goal} color={color} height={3} />
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                faltan {remaining}g
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
