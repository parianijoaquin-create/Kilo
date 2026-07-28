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
import { FoodRow, SectionHeader } from "@/components/food/FoodRow";
import { PhotoConfirmPanel } from "@/components/food/PhotoConfirmPanel";
import { PhotoReviewPanel } from "@/components/food/PhotoReviewPanel";
import { PortionPickerPanel } from "@/components/food/PortionPickerPanel";
import { BarcodeScannerPanel } from "@/components/food/BarcodeScannerPanel";
import type { ReviewComponent, ScannerMode, ScannerStatus } from "@/components/food/foodSheetTypes";

const TABS = ["Frecuentes", "Recientes", "Mis recetas"] as const;
type Tab = (typeof TABS)[number];

// Catálogo cargado una vez por sesión y buscado en memoria (acentos + ranking).
const CATALOG_COLS =
  "id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name, is_verified, is_generic";
let CATALOG_CACHE: RankableFood[] | null = null;

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

      if (!userId) {
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
  }, [ensureCatalog, mealId, userId]);

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
        <PhotoConfirmPanel
          url={pendingPhoto.url}
          hint={photoHint}
          onHintChange={setPhotoHint}
          onRetake={() => photoInputRef.current?.click()}
          onAnalyze={() => void analyzePhoto(pendingPhoto.file, photoHint)}
          onCancel={() => {
            URL.revokeObjectURL(pendingPhoto.url);
            setPendingPhoto(null);
            setPhotoHint("");
          }}
        />
      )}

      {reviewComponents && replacingIndex == null && (
        <PhotoReviewPanel
          components={reviewComponents}
          dishName={reviewDishName}
          aiConfidence={aiConfidence}
          adding={adding}
          onSetComp={(i, patch) =>
            setReviewComponents((prev) => {
              if (!prev) return prev;
              const next = [...prev];
              next[i] = { ...next[i], ...patch };
              return next;
            })
          }
          onReplace={(i) => { setReplacingIndex(i); setQuery(""); }}
          onCancel={() => { setReviewComponents(null); setScannerStatus("idle"); }}
          onConfirm={addAllComponents}
        />
      )}

      {pendingFood && (
        <PortionPickerPanel
          food={pendingFood}
          grams={portionGrams}
          onGramsChange={setPortionGrams}
          portionSource={portionSource}
          aiConfidence={aiConfidence}
          adding={adding}
          onCancel={() => setPendingFood(null)}
          onConfirm={confirmPortion}
        />
      )}

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
        <BarcodeScannerPanel
          mode={scannerMode}
          status={scannerStatus}
          message={scannerMessage}
          manualBarcode={manualBarcode}
          adding={adding}
          videoRef={videoRef}
          onManualChange={setManualBarcode}
          onManualSubmit={() => void lookupBarcode(manualBarcode)}
          onSwitchToManual={() => {
            stopScanner();
            setScannerMode("manual");
            setScannerStatus("idle");
            setScannerMessage("Ingresalo manualmente si la camara no lo toma.");
          }}
        />
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
