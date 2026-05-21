"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useSheet, type FoodSearchResult } from "@/context/SheetContext";
import { createClient } from "@/lib/supabase/client";
import { IconSearch, IconCamera, IconBarcode, IconClose } from "@/components/icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser";

const TABS = ["Frecuentes", "Recientes", "Mis recetas"] as const;
type Tab = (typeof TABS)[number];

type ScannerMode = "idle" | "camera" | "manual";
type ScannerStatus = "idle" | "requesting" | "scanning" | "lookup" | "success" | "error";

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-2)" }}>
      <span style={{ color, fontWeight: 700 }}>{label}</span> {value}g
    </span>
  );
}

function FoodRow({ food, onAdd }: { food: FoodSearchResult; onAdd: (food: FoodSearchResult) => void }) {
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

export function AddFoodSheet() {
  const { isOpen, mealId, addItemFn, closeSheet } = useSheet();
  const [activeTab, setActiveTab] = useState<Tab>("Frecuentes");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>("idle");
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanInFlightRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchSeqRef = useRef(0);

  const fetchFoods = useCallback(async (q: string) => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    const req = supabase
      .from("foods")
      .select("id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name");

    const { data, error: err } = await (q.length >= 2
      ? req.ilike("canonical_name", `%${q}%`).limit(30)
      : req.order("canonical_name").limit(20));

    // Discard if a newer fetch was started while we were waiting
    if (seq !== fetchSeqRef.current) return;

    setFoods((data as FoodSearchResult[]) ?? []);
    setError(err?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => fetchFoods(query), query.length >= 2 ? 200 : 0);
    return () => clearTimeout(t);
  }, [query, isOpen, fetchFoods]);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setError(null);
      setAdding(false);
      setScannerMode("idle");
      setScannerStatus("idle");
      setScannerMessage(null);
      setManualBarcode("");
    }
  }, [isOpen]);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    scanInFlightRef.current = false;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || scannerMode !== "camera") stopScanner();
    return () => stopScanner();
  }, [isOpen, scannerMode, stopScanner]);

  const lookupBarcode = useCallback(async (barcode: string) => {
    const cleanBarcode = barcode.replace(/\D/g, "");

    if (!addItemFn || !mealId || adding || !cleanBarcode) return;
    if (!/^\d{8,14}$/.test(cleanBarcode)) {
      setScannerStatus("error");
      setScannerMessage("El codigo debe tener entre 8 y 14 numeros.");
      return;
    }

    setAdding(true);
    setScannerStatus("lookup");
    setScannerMessage(`Buscando ${cleanBarcode}...`);

    try {
      const res = await fetch(`/api/foods/barcode?barcode=${cleanBarcode}`);
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error ?? "No pudimos encontrar ese producto.");
      }

      const result = await addItemFn(payload.food as FoodSearchResult, mealId);
      if (result.error) throw new Error(result.error);

      stopScanner();
      setScannerStatus("success");
      setScannerMessage("Producto agregado al diario.");
      closeSheet();
    } catch (err) {
      scanInFlightRef.current = false;
      setScannerStatus("error");
      setScannerMessage(err instanceof Error ? err.message : "No pudimos leer el codigo.");
    } finally {
      setAdding(false);
    }
  }, [addItemFn, adding, closeSheet, mealId, stopScanner]);

  const startBarcodeScanner = useCallback(async () => {
    setScannerMode("camera");
    setScannerStatus("requesting");
    setScannerMessage("Permiti el acceso a la camara.");

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMode("manual");
      setScannerStatus("error");
      setScannerMessage("Tu navegador no soporta camara. Ingresalo manualmente.");
      return;
    }

    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });

    try {
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        videoRef.current!,
        (result) => {
          if (!result || scanInFlightRef.current) return;
          const raw = result.getText().replace(/\D/g, "");
          if (!raw) return;
          scanInFlightRef.current = true;
          void lookupBarcode(raw);
        }
      );
      controlsRef.current = controls;
      setScannerStatus("scanning");
      setScannerMessage("Apunta al codigo y mantenelo dentro del recuadro.");
    } catch (err) {
      stopScanner();
      setScannerMode("manual");
      setScannerStatus("error");
      const isPermission = err instanceof DOMException && err.name === "NotAllowedError";
      setScannerMessage(
        isPermission
          ? "La camara esta bloqueada. Habilitala desde el navegador o ingresalo manualmente."
          : "No pudimos abrir la camara. Ingresalo manualmente."
      );
    }
  }, [lookupBarcode, stopScanner]);

  async function handleAdd(food: FoodSearchResult) {
    if (!addItemFn || !mealId || adding) return;
    setAdding(true);
    await addItemFn(food, mealId);
    setAdding(false);
    closeSheet();
  }

  return (
    <Sheet open={isOpen} onClose={closeSheet} height="82%">
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 20px 0",
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
        }}>
          {mealId ? `Agregar a ${mealId}` : "Agregar alimento"}
        </div>
        <button
          className="kilo-pressable"
          onClick={closeSheet}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "var(--bg-2)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconClose size={16} color="var(--text-2)" />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 14,
          padding: "0 14px",
          height: 44,
        }}>
          <IconSearch size={16} color="var(--text-3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimento, marca…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "var(--text-1)",
              fontFamily: "var(--font-body)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
            >
              <IconClose size={14} color="var(--text-3)" />
            </button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "10px 20px 0", display: "flex", gap: 8, flexShrink: 0 }}>
        {[
          { Icon: IconBarcode, label: "Código de barras", color: "var(--blue)" },
          { Icon: IconCamera,  label: "Foto",             color: "var(--orange)" },
        ].map(({ Icon, label, color }) => (
          <button
            key={label}
            className="kilo-pressable"
            onClick={() => {
              if (Icon === IconBarcode) {
                void startBarcodeScanner();
                return;
              }
              stopScanner();
              setScannerMode("idle");
              photoInputRef.current?.click();
            }}
            disabled={adding || scannerStatus === "requesting" || scannerStatus === "lookup"}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 0",
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 11.5,
              color: "var(--text-2)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          >
            <Icon size={15} color={color} />
            {label}
          </button>
        ))}
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setScannerStatus("success");
          setScannerMessage("Foto recibida. El calculo automatico con IA va en el siguiente paso.");
          e.currentTarget.value = "";
        }}
      />

      {(scannerMode !== "idle" || scannerMessage) && (
        <div style={{ padding: "10px 20px 0", flexShrink: 0 }}>
          <div style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            {scannerMode === "camera" && (
              <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#050814" }}>
                <video
                  ref={videoRef}
                  muted
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

            {scannerMode === "manual" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void lookupBarcode(manualBarcode);
                }}
                style={{ display: "flex", gap: 8, padding: 10 }}
              >
                <input
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
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
              padding: scannerMode === "camera" ? "10px 12px" : "0 12px 10px",
            }}>
              <div style={{
                color: scannerStatus === "error" ? "var(--orange)" : "var(--text-2)",
                fontSize: 11.5,
                lineHeight: 1.35,
              }}>
                {scannerMessage}
              </div>
              {scannerMode === "camera" && (
                <button
                  onClick={() => {
                    stopScanner();
                    setScannerMode("manual");
                    setScannerStatus("idle");
                    setScannerMessage("Ingresalo manualmente si la camara no lo toma.");
                  }}
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
      )}

      {/* Tabs */}
      <div style={{
        padding: "12px 20px 0",
        display: "flex",
        gap: 4,
        flexShrink: 0,
        borderBottom: "0.5px solid var(--line-1)",
        paddingBottom: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--lime)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "var(--lime)" : "var(--text-3)",
              fontFamily: "var(--font-body)",
              transition: "color var(--motion-state), border-color var(--motion-state)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Food list */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        {loading ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            gap: 8,
          }}>
            <div style={{ fontSize: 13.5, color: "var(--text-3)" }}>Cargando…</div>
          </div>
        ) : error ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            gap: 8,
          }}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <div style={{ fontSize: 13.5, color: "var(--text-3)", textAlign: "center" }}>
              Error al cargar alimentos
            </div>
          </div>
        ) : foods.length > 0 ? (
          foods.map((food) => (
            <FoodRow key={food.id} food={food} onAdd={handleAdd} />
          ))
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            gap: 8,
          }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontSize: 13.5, color: "var(--text-3)", textAlign: "center" }}>
              {query.length >= 2
                ? `No encontramos "${query}"`
                : "No hay alimentos disponibles"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", opacity: 0.6 }}>
              Probá otro nombre o escanéalo
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
