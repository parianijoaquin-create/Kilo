import { IconCamera, IconClose } from "@/components/icons";
import { portionChips } from "@/lib/portions";
import type { FoodSearchResult } from "@/context/SheetContext";

interface PortionPickerPanelProps {
  food: FoodSearchResult;
  /** Gramos como string editable (el input permite parcial). */
  grams: string;
  onGramsChange: (value: string) => void;
  /** "history" cuando el valor viene de la porción habitual del usuario. */
  portionSource: "default" | "history";
  aiConfidence: number | null;
  adding: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Overlay "¿Cuánto comiste?": ajuste de porción en gramos con chips de porciones
 * y presets, más el total de kcal/macros. Presentacional; el estado (pendingFood,
 * portionGrams) y el guardado viven en AddFoodSheet.
 */
export function PortionPickerPanel({
  food, grams: gramsStr, onGramsChange, portionSource, aiConfidence, adding, onCancel, onConfirm,
}: PortionPickerPanelProps) {
  const grams = Number(gramsStr) || 0;
  const f = grams / 100;
  const kcal = Math.round((food.kcal_100g ?? 0) * f);
  const p = Math.round((food.protein_g_100g ?? 0) * f * 10) / 10;
  const c = Math.round((food.carbs_g_100g ?? 0) * f * 10) / 10;
  const g = Math.round((food.fat_g_100g ?? 0) * f * 10) / 10;
  const hp = portionChips(food.default_portion_name, food.default_portion_g);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      background: "var(--bg-0)",
      padding: "20px 20px 24px",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500,
          letterSpacing: "-0.02em", color: "var(--text-1)",
        }}>
          ¿Cuánto comiste?
        </div>
        <button
          onClick={onCancel}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: "var(--bg-2)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <IconClose size={16} color="var(--text-2)" />
        </button>
      </div>

      <div style={{ marginTop: 16, fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>
        {food.canonical_name}
      </div>
      {food.source_method === "photo" && (
        <div style={{
          marginTop: 6,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          padding: "3px 9px",
          borderRadius: 999,
          background: "color-mix(in srgb, var(--orange) 14%, transparent)",
          border: "1px solid color-mix(in srgb, var(--orange) 35%, transparent)",
        }}>
          <IconCamera size={11} color="var(--orange)" />
          <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 600 }}>
            Estimación IA{aiConfidence != null ? ` · ${Math.round(aiConfidence * 100)}%` : ""}
          </span>
        </div>
      )}
      {food.default_portion_name && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
          Porción de ref: {food.default_portion_name} ({food.default_portion_g ?? 100}g)
        </div>
      )}
      {portionSource === "history" && (
        <div style={{
          marginTop: 6,
          display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
          padding: "3px 9px", borderRadius: 999,
          background: "color-mix(in srgb, var(--lime) 14%, transparent)",
          border: "1px solid color-mix(in srgb, var(--lime) 35%, transparent)",
        }}>
          <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--lime)", fontWeight: 600 }}>
            Tu porción habitual
          </span>
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => onGramsChange(String(Math.max(0, grams - 10)))}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--bg-2)", border: "1px solid var(--line-2)",
            color: "var(--text-1)", fontSize: 18, cursor: "pointer",
          }}
        >−</button>
        <input
          value={gramsStr}
          onChange={(e) => onGramsChange(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          style={{
            flex: 1, height: 44, textAlign: "center",
            background: "var(--bg-2)", border: "1px solid var(--line-2)",
            borderRadius: 12, color: "var(--text-1)",
            fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600,
            outline: "none",
          }}
        />
        <button
          onClick={() => onGramsChange(String(grams + 10))}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--bg-2)", border: "1px solid var(--line-2)",
            color: "var(--text-1)", fontSize: 18, cursor: "pointer",
          }}
        >+</button>
        <span style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>g</span>
      </div>

      {hp && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", marginBottom: 6 }}>
            {hp.unitLabel.toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {hp.chips.map((chip) => {
              const active = grams === chip.grams;
              return (
                <button
                  key={chip.label}
                  onClick={() => onGramsChange(String(chip.grams))}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: active ? "var(--lime)" : "var(--bg-2)",
                    border: "1px solid var(--line-2)",
                    color: active ? "#0a0d15" : "var(--text-2)",
                    fontSize: 12, fontFamily: "var(--font-mono)", cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {chip.label}
                  <span style={{ opacity: 0.6, fontSize: 10, marginLeft: 5 }}>{chip.grams}g</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {[50, 100, 150, 200, 250].map((preset) => (
          <button
            key={preset}
            onClick={() => onGramsChange(String(preset))}
            style={{
              padding: "6px 12px", borderRadius: 8,
              background: grams === preset ? "var(--lime)" : "var(--bg-2)",
              border: "1px solid var(--line-2)",
              color: grams === preset ? "#0a0d15" : "var(--text-2)",
              fontSize: 11, fontFamily: "var(--font-mono)", cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {preset}g
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: 14,
        background: "var(--bg-1)", border: "1px solid var(--line-1)",
        borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
            Total
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500,
            color: "var(--lime)", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4,
          }}>
            {kcal}<span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}> kcal</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
            <span style={{ color: "var(--lime)", fontWeight: 700 }}>P</span> {p}g
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
            <span style={{ color: "var(--blue)", fontWeight: 700 }}>C</span> {c}g
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
            <span style={{ color: "var(--orange)", fontWeight: 700 }}>G</span> {g}g
          </span>
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, height: 48, borderRadius: 14,
            background: "var(--bg-2)", border: "1px solid var(--line-2)",
            color: "var(--text-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer",
          }}
        >Cancelar</button>
        <button
          onClick={onConfirm}
          disabled={adding || grams <= 0}
          style={{
            flex: 2, height: 48, borderRadius: 14,
            background: "var(--lime)", border: "none",
            color: "#0a0d15", fontSize: 13.5, fontWeight: 700,
            cursor: adding || grams <= 0 ? "default" : "pointer",
            opacity: adding || grams <= 0 ? 0.5 : 1,
          }}
        >{adding ? "Agregando…" : `Agregar ${grams}g`}</button>
      </div>
    </div>
  );
}
