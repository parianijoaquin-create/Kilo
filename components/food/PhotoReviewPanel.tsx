import { IconCamera, IconClose } from "@/components/icons";
import type { ReviewComponent } from "./foodSheetTypes";

interface PhotoReviewPanelProps {
  components: ReviewComponent[];
  dishName: string;
  aiConfidence: number | null;
  adding: boolean;
  /** Aplica un patch parcial al componente en el índice `i`. */
  onSetComp: (i: number, patch: Partial<ReviewComponent>) => void;
  /** Pide reemplazar el componente `i` vía el buscador. */
  onReplace: (i: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Overlay de revisión del análisis por foto: el plato separado en componentes,
 * cada uno con sus gramos editables e inclusión opcional. Presentacional; el
 * estado (reviewComponents, replacingIndex) y el guardado viven en AddFoodSheet.
 */
export function PhotoReviewPanel({
  components, dishName, aiConfidence, adding, onSetComp, onReplace, onCancel, onConfirm,
}: PhotoReviewPanelProps) {
  const includedCount = components.filter((c) => c.included && Number(c.grams) > 0).length;
  const totalKcal = components.reduce((acc, c) => {
    if (!c.included) return acc;
    const g = Number(c.grams) || 0;
    return acc + (c.food.kcal_100g ?? 0) * (g / 100);
  }, 0);

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
          Revisá los alimentos
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

      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {dishName && (
          <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{dishName}</span>
        )}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 9px", borderRadius: 999,
          background: "color-mix(in srgb, var(--orange) 14%, transparent)",
          border: "1px solid color-mix(in srgb, var(--orange) 35%, transparent)",
        }}>
          <IconCamera size={11} color="var(--orange)" />
          <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 600 }}>
            IA{aiConfidence != null ? ` · ${Math.round(aiConfidence * 100)}%` : ""}
          </span>
        </span>
      </div>

      <div style={{ marginTop: 14, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {components.map((c, i) => {
          const g = Number(c.grams) || 0;
          const kcal = Math.round((c.food.kcal_100g ?? 0) * (g / 100));
          return (
            <div key={`${c.food.id}-${i}`} style={{
              padding: 12, borderRadius: 14,
              background: c.included ? "var(--bg-1)" : "var(--bg-0)",
              border: "1px solid var(--line-1)",
              opacity: c.included ? 1 : 0.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => onSetComp(i, { included: !c.included })}
                  aria-label={c.included ? "Excluir" : "Incluir"}
                  style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                    background: c.included ? "var(--lime)" : "var(--bg-2)",
                    border: "1px solid var(--line-2)",
                    color: "#0a0d15", fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >{c.included ? "✓" : ""}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.food.canonical_name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{
                      fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 600,
                      padding: "1px 6px", borderRadius: 999,
                      background: c.matched ? "color-mix(in srgb, var(--lime) 14%, transparent)" : "color-mix(in srgb, var(--text-3) 14%, transparent)",
                      color: c.matched ? "var(--lime)" : "var(--text-3)",
                    }}>
                      {c.isVerified ? "verificado" : c.matched ? "de tu catálogo" : "estimado IA"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{kcal} kcal</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => onSetComp(i, { grams: String(Math.max(0, g - 10)) })}
                  style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--text-1)", fontSize: 16, cursor: "pointer" }}
                >−</button>
                <input
                  value={c.grams}
                  onChange={(e) => onSetComp(i, { grams: e.target.value.replace(/[^\d.]/g, "") })}
                  inputMode="decimal"
                  style={{
                    width: 72, height: 34, textAlign: "center",
                    background: "var(--bg-2)", border: "1px solid var(--line-2)",
                    borderRadius: 10, color: "var(--text-1)",
                    fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, outline: "none",
                  }}
                />
                <button
                  onClick={() => onSetComp(i, { grams: String(g + 10) })}
                  style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--text-1)", fontSize: 16, cursor: "pointer" }}
                >+</button>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>g</span>
                <button
                  onClick={() => onReplace(i)}
                  style={{
                    marginLeft: "auto", padding: "6px 12px", borderRadius: 10,
                    background: "var(--bg-2)", border: "1px solid var(--line-2)",
                    color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                  }}
                >Cambiar</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, padding: 14,
        background: "var(--bg-1)", border: "1px solid var(--line-1)",
        borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
          Total ({includedCount})
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, color: "var(--lime)", letterSpacing: "-0.03em" }}>
          {Math.round(totalKcal)}<span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}> kcal</span>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
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
          disabled={adding || includedCount === 0}
          style={{
            flex: 2, height: 48, borderRadius: 14,
            background: "var(--lime)", border: "none",
            color: "#0a0d15", fontSize: 13.5, fontWeight: 700,
            cursor: adding || includedCount === 0 ? "default" : "pointer",
            opacity: adding || includedCount === 0 ? 0.5 : 1,
          }}
        >{adding ? "Agregando…" : `Agregar ${includedCount} ${includedCount === 1 ? "alimento" : "alimentos"}`}</button>
      </div>
    </div>
  );
}
