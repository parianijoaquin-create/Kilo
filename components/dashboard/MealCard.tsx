import { MacroChip } from "@/components/ui/MacroChip";
import { IconPlus } from "@/components/icons";
import type { MockMeal } from "@/types";

const MEAL_ICONS: Record<string, string> = {
  sunrise: "🌅",
  sun: "☀️",
  sunset: "🌆",
  moon: "🌙",
};

interface MealCardProps {
  meal: MockMeal;
  onAdd: () => void;
}

export function MealCard({ meal, onAdd }: MealCardProps) {
  const empty = meal.status === "empty";
  const totalP = meal.items.reduce((s, x) => s + x.p, 0);
  const totalC = meal.items.reduce((s, x) => s + x.c, 0);
  const totalF = meal.items.reduce((s, x) => s + x.f, 0);

  return (
    <div style={{
      background: "var(--bg-1)",
      border: "1px solid var(--line-1)",
      borderRadius: 18,
      padding: "14px 16px",
      opacity: empty ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          background: "var(--bg-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}>
          {MEAL_ICONS[meal.icon] ?? "🍽️"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              color: "var(--text-1)",
            }}>
              {meal.name}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
              {meal.time}
            </span>
          </div>
          {empty ? (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Sin registrar</div>
          ) : (
            <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>
              <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{meal.kcal} kcal</span>
              {" · "}{meal.items.length} alimentos
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--bg-2)",
            border: "1px dashed var(--line-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <IconPlus size={16} color="var(--text-2)" />
        </button>
      </div>

      {!empty && (
        <div style={{ display: "flex", gap: 6, marginTop: 12, paddingLeft: 48 }}>
          <MacroChip code="P" value={`${totalP}g`} color="var(--lime)" />
          <MacroChip code="C" value={`${totalC}g`} color="var(--blue)" />
          <MacroChip code="G" value={`${totalF}g`} color="var(--orange)" />
        </div>
      )}
    </div>
  );
}
