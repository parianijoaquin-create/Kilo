import type { FoodSearchResult } from "@/context/SheetContext";

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-2)" }}>
      <span style={{ color, fontWeight: 700 }}>{label}</span> {value}g
    </span>
  );
}

export function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      padding: "14px 20px 6px",
      fontSize: 10.5,
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
    }}>
      {label}
    </div>
  );
}

export function FoodRow({ food, onAdd }: { food: FoodSearchResult; onAdd: (food: FoodSearchResult) => void }) {
  const portion = food.default_portion_name
    ? `${food.default_portion_name} · ${food.default_portion_g ?? 100}g`
    : `${food.default_portion_g ?? 100}g · Genérico`;

  return (
    <button
      className="kilo-pressable"
      onClick={() => onAdd(food)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        width: "100%",
        background: "none",
        border: "none",
        borderBottom: "0.5px solid var(--line-1)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "var(--bg-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        flexShrink: 0,
      }}>
        🥗
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: "var(--text-1)",
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {food.canonical_name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
          {portion}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <MacroBadge label="P" value={Math.round(food.protein_g_100g ?? 0)} color="var(--lime)" />
          <MacroBadge label="C" value={Math.round(food.carbs_g_100g ?? 0)} color="var(--blue)" />
          <MacroBadge label="G" value={Math.round(food.fat_g_100g ?? 0)} color="var(--orange)" />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 500,
          color: "var(--lime)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {Math.round(food.kcal_100g ?? 0)}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
          kcal
        </div>
      </div>
    </button>
  );
}
