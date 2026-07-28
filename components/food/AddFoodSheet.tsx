"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useSheet, type FoodSearchResult } from "@/context/SheetContext";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { IconSearch, IconCamera, IconBarcode, IconClose } from "@/components/icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser";
import { searchFoods, type RankableFood } from "@/lib/foodSearch";
import { suggestFoods, mealSuggestionLabel } from "@/lib/mealSuggestions";
import { portionChips } from "@/lib/portions";

const TABS = ["Frecuentes", "Recientes", "Mis recetas"] as const;
type Tab = (typeof TABS)[number];

// Catálogo cargado una vez por sesión y buscado en memoria (acentos + ranking).
const CATALOG_COLS =
  "id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name, is_verified, is_generic";
let CATALOG_CACHE: RankableFood[] | null = null;

type ScannerMode = "idle" | "camera" | "manual";
type ScannerStatus = "idle" | "requesting" | "scanning" | "lookup" | "success" | "error";

// Un componente detectado por la foto, ya resuelto contra el catálogo (o creado
// como alimento de IA), listo para revisar/editar antes de agregar al diario.
type ReviewComponent = {
  food: FoodSearchResult;
  detectedName: string;
  matched: boolean;      // true si se linkeó a un alimento del catálogo
  isVerified: boolean;   // true si el alimento matcheado está verificado
  grams: string;         // gramos editables por el usuario
  included: boolean;     // si se agrega al diario
};

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-2)" }}>
      <span style={{ color, fontWeight: 700 }}>{label}</span> {value}g
    </span>
  );
}

function SectionHeader({ label }: { label: string }) {
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
  const [suggestions, setSuggestions] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>("idle");
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanInFlightRef = useRef(false);
  const lookupRef = useRef<(barcode: string) => void>(() => {});
  const supabase = useMemo(() => createClient(), []);
  const { userId } = useAuth();

  const fetchSeqRef = useRef(0);
  const catalogLoadingRef = useRef<Promise<void> | null>(null);

  // Carga el catálogo completo una vez (paginado, por si supera el cap de 1000).
  const ensureCatalog = useCallback(async () => {
    if (CATALOG_CACHE) return;
    if (!catalogLoadingRef.current) {
      catalogLoadingRef.current = (async () => {
        const all: RankableFood[] = [];
        const PAGE = 1000;
        for (let from = 0; ; from += PAGE) {
          const { data } = await supabase
            .from("foods")
            .select(CATALOG_COLS)
            .order("id")
            .range(from, from + PAGE - 1);
          const rows = (data as RankableFood[] | null) ?? [];
          all.push(...rows);
          if (rows.length < PAGE) break;
        }
        CATALOG_CACHE = all;
      })();
    }
    await catalogLoadingRef.current;
  }, [supabase]);

  const fetchFoods = useCallback(async (q: string, tab: Tab) => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);

    // Buscando: búsqueda en memoria sobre el catálogo (insensible a acentos + ranking).
    if (q.length >= 2) {
      await ensureCatalog();
      if (seq !== fetchSeqRef.current) return;
      setSuggestions([]);
      setFoods(searchFoods(CATALOG_CACHE ?? [], q));
      setLoading(false);
      return;
    }

    if (tab === "Frecuentes" || tab === "Recientes") {
      // Sugerencias por momento del día: sólo en Frecuentes, para acompañar
      // (o reemplazar, si sos nuevo) a tus alimentos habituales.
      if (tab === "Frecuentes") {
        await ensureCatalog();
        if (seq !== fetchSeqRef.current) return;
        setSuggestions(suggestFoods(CATALOG_CACHE ?? [], mealId));
      } else {
        setSuggestions([]);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (seq !== fetchSeqRef.current) return;
        setFoods([]); setLoading(false); return;
      }

      // Fetch recent meal_items for this user (RLS narrows by ownership). Cap at 200 for grouping.
      const { data: items, error: err } = await supabase
        .from("meal_items")
        .select(`
          food_id, created_at,
          foods!inner ( id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name )
        `)
        .not("food_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (seq !== fetchSeqRef.current) return;

      type Row = { food_id: number; created_at: string; foods: FoodSearchResult };
      const rows = (items ?? []) as unknown as Row[];

      if (tab === "Recientes") {
        const seen = new Set<number>();
        const deduped: FoodSearchResult[] = [];
        for (const r of rows) {
          if (!r.foods || seen.has(r.food_id)) continue;
          seen.add(r.food_id);
          deduped.push(r.foods);
          if (deduped.length >= 30) break;
        }
        setFoods(deduped);
      } else {
        const counts = new Map<number, { count: number; food: FoodSearchResult }>();
        for (const r of rows) {
          if (!r.foods) continue;
          const entry = counts.get(r.food_id);
          if (entry) entry.count++;
          else counts.set(r.food_id, { count: 1, food: r.foods });
        }
        const sorted = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 30).map((e) => e.food);
        setFoods(sorted);
      }

      setError(err?.message ?? null);
      setLoading(false);
      return;
    }

    // Mis recetas → not implemented yet
    if (seq !== fetchSeqRef.current) return;
    setSuggestions([]);
    setFoods([]);
    setLoading(false);
  }, [ensureCatalog, mealId]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => fetchFoods(query, activeTab), query.length >= 2 ? 200 : 0);
    return () => clearTimeout(t);
  }, [query, isOpen, activeTab, fetchFoods]);

  // Precargar el catálogo al abrir para que la primera búsqueda sea instantánea.
  useEffect(() => {
    if (isOpen) void ensureCatalog();
  }, [isOpen, ensureCatalog]);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setError(null);
      setAdding(false);
      setAnalyzingPhoto(false);
      setScannerMode("idle");
      setScannerStatus("idle");
      setScannerMessage(null);
      setManualBarcode("");
      setPendingFood(null);
      setPortionGrams("");
      setSuggestions([]);
      setReviewComponents(null);
      setReplacingIndex(null);
      setPhotoHint("");
      setPendingPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
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

  // Keep a stable ref to the latest lookup so the camera effect doesn't
  // restart every time `adding` toggles mid-scan.
  useEffect(() => {
    lookupRef.current = lookupBarcode;
  }, [lookupBarcode]);

  // Just flips to camera mode; the actual stream start happens in the effect
  // below, once the <video> element is mounted in the DOM.
  const startBarcodeScanner = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMode("manual");
      setScannerStatus("error");
      setScannerMessage("Tu navegador no soporta camara. Ingresalo manualmente.");
      return;
    }
    setScannerMode("camera");
    setScannerStatus("requesting");
    setScannerMessage("Permiti el acceso a la camara.");
  }, []);

  // Start the camera stream once the <video> is actually rendered.
  useEffect(() => {
    if (!isOpen || scannerMode !== "camera") return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
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

    (async () => {
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
          videoEl,
          (result) => {
            if (!result || scanInFlightRef.current) return;
            const raw = result.getText().replace(/\D/g, "");
            if (!raw) return;
            scanInFlightRef.current = true;
            lookupRef.current(raw);
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        // iOS Safari sometimes needs an explicit play() to render inline.
        void videoEl.play().catch(() => {});
        setScannerStatus("scanning");
        setScannerMessage("Apunta al codigo y mantenelo dentro del recuadro.");
      } catch (err) {
        if (cancelled) return;
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
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, scannerMode, stopScanner]);

  const [pendingFood, setPendingFood] = useState<FoodSearchResult | null>(null);
  const [portionGrams, setPortionGrams] = useState<string>("");
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  // "history" cuando prellenamos con la porción que el usuario suele usar para
  // este alimento (más confiable que cualquier estimación de la IA).
  const [portionSource, setPortionSource] = useState<"default" | "history">("default");
  const portionPickerSeqRef = useRef(0);

  // Revisión multi-item del análisis por foto: el plato separado en componentes.
  const [reviewComponents, setReviewComponents] = useState<ReviewComponent[] | null>(null);
  const [reviewDishName, setReviewDishName] = useState<string>("");
  // Índice del componente que se está reemplazando vía el buscador (o null).
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // Foto tomada esperando confirmación: mostramos preview + campo opcional para
  // que el usuario aclare qué es (ej: "milanesas de cerdo") antes de analizar.
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoHint, setPhotoHint] = useState<string>("");

  function openPortionPicker(food: FoodSearchResult) {
    const seq = ++portionPickerSeqRef.current;
    setPendingFood(food);
    setPortionGrams(String(food.default_portion_g ?? 100));
    setAiConfidence(null);
    setPortionSource("default");

    // Memoria de porción típica: si el usuario ya cargó este alimento antes,
    // arrancamos en su última porción real en vez del estimado/genérico.
    if (userId && food.id) {
      void (async () => {
        const { data } = await supabase
          .from("meal_items")
          .select("grams, meals!inner(user_id, eaten_at)")
          .eq("meals.user_id", userId)
          .eq("food_id", food.id)
          .not("grams", "is", null)
          .order("eaten_at", { referencedTable: "meals", ascending: false })
          .limit(1)
          .maybeSingle();
        // Ignorar si el picker cambió mientras tanto (otra selección).
        if (portionPickerSeqRef.current !== seq) return;
        const lastGrams = data?.grams;
        if (typeof lastGrams === "number" && lastGrams > 0) {
          setPortionGrams(String(Math.round(lastGrams)));
          setPortionSource("history");
        }
      })();
    }
  }

  async function confirmPortion() {
    if (!addItemFn || !mealId || adding || !pendingFood) return;
    const grams = Number(portionGrams);
    if (!Number.isFinite(grams) || grams <= 0) return;
    setAdding(true);
    await addItemFn(pendingFood, mealId, grams);
    setAdding(false);
    setPendingFood(null);
    closeSheet();
  }

  // Tap sobre un resultado de búsqueda: si estamos reemplazando un componente de
  // la revisión por foto, sustituimos ese alimento; si no, abrimos el picker.
  function handleFoodRowTap(food: FoodSearchResult) {
    if (replacingIndex != null) {
      setReviewComponents((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        const cur = next[replacingIndex];
        if (cur) {
          next[replacingIndex] = {
            ...cur,
            food,
            detectedName: food.canonical_name,
            matched: true,
            isVerified: false,
            grams: String(food.default_portion_g ?? (Number(cur.grams) || 100)),
          };
        }
        return next;
      });
      setReplacingIndex(null);
      setQuery("");
      return;
    }
    openPortionPicker(food);
  }

  async function addAllComponents() {
    if (!addItemFn || !mealId || adding || !reviewComponents) return;
    const toAdd = reviewComponents.filter((c) => {
      const g = Number(c.grams);
      return c.included && Number.isFinite(g) && g > 0;
    });
    if (toAdd.length === 0) return;
    setAdding(true);
    for (const c of toAdd) {
      await addItemFn(c.food, mealId, Math.round(Number(c.grams)));
    }
    setAdding(false);
    setReviewComponents(null);
    closeSheet();
  }

  async function analyzePhoto(file: File, hint?: string) {
    if (analyzingPhoto || adding) return;
    setAnalyzingPhoto(true);
    setScannerStatus("lookup");
    setScannerMessage("Analizando la foto con IA…");

    try {
      const form = new FormData();
      form.append("photo", file);
      const trimmedHint = hint?.trim();
      if (trimmedHint) form.append("hint", trimmedHint);
      const res = await fetch("/api/foods/photo", { method: "POST", body: form });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error ?? "No pudimos analizar la foto.");
      }

      const rawComponents = Array.isArray(payload.components) ? payload.components : [];
      const components: ReviewComponent[] = rawComponents
        .filter((c: unknown): c is Record<string, unknown> => !!c && typeof c === "object" && !!(c as { food?: unknown }).food)
        .map((c: Record<string, unknown>) => {
          const food = c.food as FoodSearchResult;
          return {
            food,
            detectedName: typeof c.detected_name === "string" ? c.detected_name : food.canonical_name,
            matched: !!c.matched,
            isVerified: !!c.is_verified,
            grams: String(Math.round(Number(c.estimated_g) || food.default_portion_g || 100)),
            included: true,
          };
        });

      if (components.length === 0) {
        throw new Error("No reconocimos comida en la foto. Probá con otra toma.");
      }

      setReviewDishName(typeof payload.dish_name === "string" ? payload.dish_name : "");
      setAiConfidence(typeof payload.confidence === "number" ? payload.confidence : null);
      setReviewComponents(components);
      setReplacingIndex(null);
      setScannerStatus("success");
      setScannerMessage(null);
    } catch (err) {
      setScannerStatus("error");
      setScannerMessage(err instanceof Error ? err.message : "No pudimos analizar la foto.");
    } finally {
      setAnalyzingPhoto(false);
      setPendingPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setPhotoHint("");
    }
  }

  const showSuggestions =
    activeTab === "Frecuentes" && query.length < 2 && suggestions.length > 0;

  return (
    <Sheet open={isOpen} onClose={closeSheet} height="82%">
      {pendingPhoto && !analyzingPhoto && (
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
              onClick={() => {
                URL.revokeObjectURL(pendingPhoto.url);
                setPendingPhoto(null);
                setPhotoHint("");
              }}
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
              src={pendingPhoto.url}
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
            value={photoHint}
            onChange={(e) => setPhotoHint(e.target.value.slice(0, 200))}
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
              onClick={() => photoInputRef.current?.click()}
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
              onClick={() => void analyzePhoto(pendingPhoto.file, photoHint)}
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
      )}

      {reviewComponents && replacingIndex == null && (() => {
        const includedCount = reviewComponents.filter((c) => c.included && Number(c.grams) > 0).length;
        const totalKcal = reviewComponents.reduce((acc, c) => {
          if (!c.included) return acc;
          const g = Number(c.grams) || 0;
          return acc + (c.food.kcal_100g ?? 0) * (g / 100);
        }, 0);
        const setComp = (i: number, patch: Partial<ReviewComponent>) =>
          setReviewComponents((prev) => {
            if (!prev) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
          });
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
                onClick={() => { setReviewComponents(null); setScannerStatus("idle"); }}
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
              {reviewDishName && (
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{reviewDishName}</span>
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
              {reviewComponents.map((c, i) => {
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
                        onClick={() => setComp(i, { included: !c.included })}
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
                        onClick={() => setComp(i, { grams: String(Math.max(0, g - 10)) })}
                        style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--text-1)", fontSize: 16, cursor: "pointer" }}
                      >−</button>
                      <input
                        value={c.grams}
                        onChange={(e) => setComp(i, { grams: e.target.value.replace(/[^\d.]/g, "") })}
                        inputMode="decimal"
                        style={{
                          width: 72, height: 34, textAlign: "center",
                          background: "var(--bg-2)", border: "1px solid var(--line-2)",
                          borderRadius: 10, color: "var(--text-1)",
                          fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, outline: "none",
                        }}
                      />
                      <button
                        onClick={() => setComp(i, { grams: String(g + 10) })}
                        style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--text-1)", fontSize: 16, cursor: "pointer" }}
                      >+</button>
                      <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>g</span>
                      <button
                        onClick={() => { setReplacingIndex(i); setQuery(""); }}
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
                onClick={() => { setReviewComponents(null); setScannerStatus("idle"); }}
                style={{
                  flex: 1, height: 48, borderRadius: 14,
                  background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  color: "var(--text-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                }}
              >Cancelar</button>
              <button
                onClick={addAllComponents}
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
      })()}

      {pendingFood && (() => {
        const grams = Number(portionGrams) || 0;
        const f = grams / 100;
        const kcal = Math.round((pendingFood.kcal_100g ?? 0) * f);
        const p = Math.round((pendingFood.protein_g_100g ?? 0) * f * 10) / 10;
        const c = Math.round((pendingFood.carbs_g_100g  ?? 0) * f * 10) / 10;
        const g = Math.round((pendingFood.fat_g_100g    ?? 0) * f * 10) / 10;
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
                onClick={() => setPendingFood(null)}
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
              {pendingFood.canonical_name}
            </div>
            {pendingFood.source_method === "photo" && (
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
            {pendingFood.default_portion_name && (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                Porción de ref: {pendingFood.default_portion_name} ({pendingFood.default_portion_g ?? 100}g)
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
                onClick={() => setPortionGrams(String(Math.max(0, grams - 10)))}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  color: "var(--text-1)", fontSize: 18, cursor: "pointer",
                }}
              >−</button>
              <input
                value={portionGrams}
                onChange={(e) => setPortionGrams(e.target.value.replace(/[^\d.]/g, ""))}
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
                onClick={() => setPortionGrams(String(grams + 10))}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  color: "var(--text-1)", fontSize: 18, cursor: "pointer",
                }}
              >+</button>
              <span style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>g</span>
            </div>

            {(() => {
              const hp = portionChips(pendingFood.default_portion_name, pendingFood.default_portion_g);
              if (!hp) return null;
              return (
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
                          onClick={() => setPortionGrams(String(chip.grams))}
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
              );
            })()}

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {[50, 100, 150, 200, 250].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPortionGrams(String(preset))}
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
                onClick={() => setPendingFood(null)}
                style={{
                  flex: 1, height: 48, borderRadius: 14,
                  background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  color: "var(--text-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                }}
              >Cancelar</button>
              <button
                onClick={confirmPortion}
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
      })()}

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

      {/* Banner de reemplazo de componente (flujo revisión por foto) */}
      {replacingIndex != null && (
        <div style={{
          margin: "10px 20px 0", padding: "8px 12px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          background: "color-mix(in srgb, var(--lime) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--lime) 35%, transparent)",
          borderRadius: 12,
        }}>
          <span style={{ fontSize: 12, color: "var(--text-1)" }}>Elegí el alimento de reemplazo</span>
          <button
            onClick={() => { setReplacingIndex(null); setQuery(""); }}
            style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >Volver</button>
        </div>
      )}

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
            disabled={adding || analyzingPhoto || scannerStatus === "requesting" || scannerStatus === "lookup"}
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
          e.currentTarget.value = "";
          if (!file) return;
          setPendingPhoto((prev) => {
            if (prev) URL.revokeObjectURL(prev.url);
            return { file, url: URL.createObjectURL(file) };
          });
          setPhotoHint("");
          setScannerStatus("idle");
          setScannerMessage(null);
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
        ) : foods.length > 0 || showSuggestions ? (
          <>
            {foods.length > 0 && (
              <>
                {showSuggestions && <SectionHeader label="Tus frecuentes" />}
                {foods.map((food) => (
                  <FoodRow key={food.id} food={food} onAdd={handleFoodRowTap} />
                ))}
              </>
            )}
            {showSuggestions && (
              <>
                <SectionHeader label={mealSuggestionLabel(mealId)} />
                {suggestions.map((food) => (
                  <FoodRow key={`sug-${food.id}`} food={food} onAdd={handleFoodRowTap} />
                ))}
              </>
            )}
          </>
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
              {query.length >= 2 ? `No encontramos "${query}"`
                : activeTab === "Frecuentes" ? "Todavía no tenés alimentos frecuentes"
                : activeTab === "Recientes" ? "Aún no registraste comidas"
                : activeTab === "Mis recetas" ? "Las recetas llegan pronto"
                : "No hay alimentos disponibles"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", opacity: 0.6 }}>
              {activeTab === "Mis recetas"
                ? "Próximamente vas a poder armar combinaciones."
                : "Buscá por nombre o escaneá un código."}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
