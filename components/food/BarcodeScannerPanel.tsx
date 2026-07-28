import type { RefObject } from "react";
import type { ScannerMode, ScannerStatus } from "./foodSheetTypes";

interface BarcodeScannerPanelProps {
  mode: ScannerMode;
  status: ScannerStatus;
  message: string | null;
  manualBarcode: string;
  adding: boolean;
  /** Ref al <video> donde el lector engancha el stream de la cámara. */
  videoRef: RefObject<HTMLVideoElement | null>;
  onManualChange: (value: string) => void;
  onManualSubmit: () => void;
  onSwitchToManual: () => void;
}

/**
 * Panel del escáner de código de barras: preview de cámara con recuadro guía o
 * input manual, más la línea de estado. Presentacional; toda la lógica de
 * cámara/lectura (efectos, refs, lookup) vive en AddFoodSheet.
 */
export function BarcodeScannerPanel({
  mode, status, message, manualBarcode, adding, videoRef,
  onManualChange, onManualSubmit, onSwitchToManual,
}: BarcodeScannerPanelProps) {
  return (
    <div style={{ padding: "10px 20px 0", flexShrink: 0 }}>
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: 14,
        overflow: "hidden",
      }}>
        {mode === "camera" && (
          <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#050814" }}>
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute",
              left: "13%",
              right: "13%",
              top: "32%",
              bottom: "32%",
              border: "2px solid var(--lime)",
              borderRadius: 12,
              boxShadow: "0 0 0 999px rgba(5,8,20,0.48)",
            }} />
          </div>
        )}

        {mode === "manual" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onManualSubmit();
            }}
            style={{ display: "flex", gap: 8, padding: 10 }}
          >
            <input
              value={manualBarcode}
              onChange={(e) => onManualChange(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoFocus
              placeholder="EAN / UPC"
              style={{
                flex: 1,
                minWidth: 0,
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--line-2)",
                background: "var(--bg-1)",
                color: "var(--text-1)",
                padding: "0 12px",
                fontFamily: "var(--font-mono)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={adding || manualBarcode.length < 8}
              style={{
                height: 38,
                borderRadius: 10,
                border: "none",
                background: "var(--lime)",
                color: "#0a0d15",
                padding: "0 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: manualBarcode.length >= 8 ? "pointer" : "default",
                opacity: manualBarcode.length >= 8 ? 1 : 0.55,
              }}
            >
              Cargar
            </button>
          </form>
        )}

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: mode === "camera" ? "10px 12px" : "0 12px 10px",
        }}>
          <div style={{
            color: status === "error" ? "var(--orange)" : "var(--text-2)",
            fontSize: 11.5,
            lineHeight: 1.35,
          }}>
            {message}
          </div>
          {mode === "camera" && (
            <button
              onClick={onSwitchToManual}
              style={{
                flexShrink: 0,
                background: "none",
                border: "none",
                color: "var(--lime)",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              Manual
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
