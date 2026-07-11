"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { IconClose } from "@/components/icons";
import { haptic } from "@/lib/haptics";
import { per100FromItem, scaleFromPer100 } from "@/lib/nutrition/scaling";
import type { DiaryItem } from "@/hooks/useDiary";

const PRESETS = [50, 100, 150, 200, 250];

export function EditPortionSheet({
  item,
  onClose,
  onSave,
}: {
  item: DiaryItem | null;
  onClose: () => void;
  onSave: (grams: number) => Promise<{ error: string | null }>;
}) {
  const [grams, setGrams] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setGrams(String(item.grams ?? 100));
  }, [item]);

  const basis = useMemo(() => (item ? per100FromItem(item) : null), [item]);
  const g = Number(grams) || 0;
  const scaled = basis ? scaleFromPer100(basis, g) : null;
  const original = item?.grams ?? 0;
  const changed = g > 0 && g !== original;

  async function handleSave() {
    if (!item || saving || !changed || g <= 0) return;
    setSaving(true);
    const res = await onSave(g);
    setSaving(false);
    if (!res.error) {
      haptic("success");
      onClose();
    }
  }

  return (
    <Sheet open={item != null} onClose={onClose} height="auto">
      {item && scaled && (
        <div style={{ padding: "8px 20px 24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500,
              letterSpacing: "-0.02em", color: "var(--text-1)",
            }}>
              Editar porción
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "var(--bg-2)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <IconClose size={16} color="var(--text-2)" />
            </button>
          </div>

          <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>
            {item.item_name_snapshot}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
            Antes: {original}g
          </div>

          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setGrams(String(Math.max(0, g - 10)))}
              style={stepBtn}
            >−</button>
            <input
              value={grams}
              onChange={(e) => setGrams(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              autoFocus
              style={{
                flex: 1, height: 44, textAlign: "center",
                background: "var(--bg-2)", border: "1px solid var(--line-2)",
                borderRadius: 12, color: "var(--text-1)",
                fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600,
                outline: "none",
              }}
            />
            <button
              onClick={() => setGrams(String(g + 10))}
              style={stepBtn}
            >+</button>
            <span style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>g</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setGrams(String(preset))}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: g === preset ? "var(--lime)" : "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  color: g === preset ? "#0a0d15" : "var(--text-2)",
                  fontSize: 11, fontFamily: "var(--font-mono)", cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {preset}g
              </button>
            ))}
          </div>

          <div style={{
            marginTop: 18, padding: 14,
            background: "var(--bg-2)", border: "1px solid var(--line-1)",
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
                {scaled.calories_kcal}<span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}> kcal</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={macroTxt}><span style={{ color: "var(--lime)", fontWeight: 700 }}>P</span> {scaled.protein_g}g</span>
              <span style={macroTxt}><span style={{ color: "var(--blue)", fontWeight: 700 }}>C</span> {scaled.carbs_g}g</span>
              <span style={macroTxt}><span style={{ color: "var(--orange)", fontWeight: 700 }}>G</span> {scaled.fat_g}g</span>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 48, borderRadius: 14,
              background: "var(--bg-2)", border: "1px solid var(--line-2)",
              color: "var(--text-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer",
            }}>Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !changed || g <= 0}
              style={{
                flex: 2, height: 48, borderRadius: 14,
                background: "var(--lime)", border: "none",
                color: "#0a0d15", fontSize: 13.5, fontWeight: 700,
                cursor: saving || !changed || g <= 0 ? "default" : "pointer",
                opacity: saving || !changed || g <= 0 ? 0.5 : 1,
              }}
            >{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

const stepBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 12,
  background: "var(--bg-2)", border: "1px solid var(--line-2)",
  color: "var(--text-1)", fontSize: 18, cursor: "pointer",
};
const macroTxt: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)",
};
