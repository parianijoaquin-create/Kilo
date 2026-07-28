interface PhotoConfirmPanelProps {
  /** URL de object para el preview de la foto tomada. */
  url: string;
  hint: string;
  onHintChange: (value: string) => void;
  onRetake: () => void;
  onAnalyze: () => void;
  onCancel: () => void;
}

/**
 * Overlay de confirmación de foto: preview + campo opcional de aclaración antes
 * de mandarla a analizar. Presentacional; el estado (pendingPhoto, photoHint) y
 * la llamada a la API viven en AddFoodSheet.
 */
export function PhotoConfirmPanel({ url, hint, onHintChange, onRetake, onAnalyze, onCancel }: PhotoConfirmPanelProps) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 11,
      background: "var(--bg-0)",
      padding: "20px 20px 24px",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500,
          letterSpacing: "-0.02em", color: "var(--text-1)",
        }}>
          Confirmá la foto
        </div>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-3)", fontSize: 13, fontFamily: "var(--font-body)",
          }}
        >
          Cancelar
        </button>
      </div>

      <div style={{
        marginTop: 14,
        borderRadius: 16,
        overflow: "hidden",
        background: "#050814",
        aspectRatio: "4 / 3",
        flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Foto de la comida"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <label style={{
        marginTop: 18, marginBottom: 6,
        fontSize: 12.5, color: "var(--text-2)", fontFamily: "var(--font-body)", fontWeight: 500,
      }}>
        ¿Algún detalle? (opcional)
      </label>
      <input
        value={hint}
        onChange={(e) => onHintChange(e.target.value.slice(0, 200))}
        placeholder="ej: milanesas de cerdo, sin salsa"
        style={{
          height: 44,
          borderRadius: 12,
          border: "1px solid var(--line-2)",
          background: "var(--bg-1)",
          color: "var(--text-1)",
          padding: "0 14px",
          fontSize: 14,
          fontFamily: "var(--font-body)",
          outline: "none",
        }}
      />
      <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--font-body)" }}>
        Ayudá a la IA a identificar bien la comida. Ella igual estima la porción por la foto.
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          className="kilo-pressable"
          onClick={onRetake}
          style={{
            flex: 1, height: 48, borderRadius: 14,
            background: "var(--bg-2)", border: "1px solid var(--line-2)",
            color: "var(--text-2)", fontSize: 14, fontWeight: 600,
            fontFamily: "var(--font-body)", cursor: "pointer",
          }}
        >
          Repetir foto
        </button>
        <button
          className="kilo-pressable"
          onClick={onAnalyze}
          style={{
            flex: 2, height: 48, borderRadius: 14, border: "none",
            background: "var(--lime)", color: "#0a0d15",
            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-body)", cursor: "pointer",
          }}
        >
          Analizar foto
        </button>
      </div>
    </div>
  );
}
