import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { GoogleGenAI, Type } from "@google/genai";
import { consumeRateLimit, consumeGlobalDailyCap } from "@/lib/rateLimit";

const AI_SOURCE_CODE = "ai_vision";
const GEMINI_MODEL = "gemini-2.5-flash";

// Per-user rate limit: máx 15 análisis de foto por minuto (persistente en DB).
const RATE_LIMIT_MAX = 15;

// Tope GLOBAL diario de llamadas a Gemini (todos los usuarios juntos). Es el
// techo de seguridad para no superar el free tier ni generar ningún cargo.
// Configurable por env; default conservador. Subilo solo si confirmás el límite
// diario (RPD) del free tier de tu modelo en https://ai.google.dev/gemini-api/docs/rate-limits
const GEMINI_DAILY_CAP = Number(process.env.GEMINI_DAILY_CAP ?? "200");

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 6 * 1024 * 1024; // 6MB

interface VisionComponent {
  name: string;
  estimated_g: number;
  kcal_100g: number;
  protein_g_100g: number;
  carbs_g_100g: number;
  fat_g_100g: number;
  fiber_g_100g: number;
}

interface VisionResult {
  recognized: boolean;
  scale_reasoning: string;
  name: string;
  components: VisionComponent[];
  portion_min_g: number;
  portion_max_g: number;
  estimated_portion_g: number;
  kcal_100g: number;
  protein_g_100g: number;
  carbs_g_100g: number;
  fat_g_100g: number;
  fiber_g_100g: number;
  confidence: number;
}

const VISION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recognized: {
      type: Type.BOOLEAN,
      description: "true si la imagen contiene comida o bebida identificable",
    },
    // Va ANTES de los números a propósito: al escribir primero el razonamiento
    // de escala, el modelo genera estimaciones de porción bastante más certeras.
    scale_reasoning: {
      type: Type.STRING,
      description:
        "Razonamiento breve de escala ANTES de dar números: qué referencias de tamaño ves (diámetro del plato ~26cm, cubiertos, vaso/lata, mano) y cómo deducís el volumen de cada componente. 1-3 frases.",
    },
    name: {
      type: Type.STRING,
      description: "Nombre del plato en español, conciso (ej: 'Milanesa con puré', 'Ensalada César')",
    },
    components: {
      type: Type.ARRAY,
      description:
        "Desglose del plato en sus componentes visibles, cada uno con su peso estimado en gramos. Estimar componente por componente es más preciso que estimar el total de una. Ej: [{name:'Milanesa', estimated_g:180},{name:'Puré', estimated_g:150}]",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Nombre del componente como alimento individual y buscable (ej: 'Milanesa de carne', 'Puré de papa', 'Arroz blanco'), no una descripción",
          },
          estimated_g: { type: Type.NUMBER, description: "Peso estimado del componente en gramos" },
          kcal_100g: { type: Type.NUMBER, description: "Calorías por cada 100g de este componente" },
          protein_g_100g: { type: Type.NUMBER, description: "Proteínas (g) por 100g de este componente" },
          carbs_g_100g: { type: Type.NUMBER, description: "Carbohidratos (g) por 100g de este componente" },
          fat_g_100g: { type: Type.NUMBER, description: "Grasas (g) por 100g de este componente" },
          fiber_g_100g: { type: Type.NUMBER, description: "Fibra (g) por 100g de este componente" },
        },
        required: ["name", "estimated_g", "kcal_100g", "protein_g_100g", "carbs_g_100g", "fat_g_100g", "fiber_g_100g"],
        propertyOrdering: ["name", "estimated_g", "kcal_100g", "protein_g_100g", "carbs_g_100g", "fat_g_100g", "fiber_g_100g"],
      },
    },
    portion_min_g: {
      type: Type.NUMBER,
      description: "Extremo bajo del rango plausible del peso total de la porción, en gramos",
    },
    portion_max_g: {
      type: Type.NUMBER,
      description: "Extremo alto del rango plausible del peso total de la porción, en gramos",
    },
    estimated_portion_g: {
      type: Type.NUMBER,
      description: "Peso total estimado de la porción visible en gramos (debe ser ~ la suma de los componentes)",
    },
    kcal_100g: { type: Type.NUMBER, description: "Calorías por cada 100g del plato completo" },
    protein_g_100g: { type: Type.NUMBER, description: "Proteínas (g) por cada 100g" },
    carbs_g_100g: { type: Type.NUMBER, description: "Carbohidratos (g) por cada 100g" },
    fat_g_100g: { type: Type.NUMBER, description: "Grasas (g) por cada 100g" },
    fiber_g_100g: { type: Type.NUMBER, description: "Fibra (g) por cada 100g" },
    confidence: {
      type: Type.NUMBER,
      description: "Confianza de la estimación entre 0 y 1",
    },
  },
  required: [
    "recognized",
    "scale_reasoning",
    "name",
    "components",
    "portion_min_g",
    "portion_max_g",
    "estimated_portion_g",
    "kcal_100g",
    "protein_g_100g",
    "carbs_g_100g",
    "fat_g_100g",
    "fiber_g_100g",
    "confidence",
  ],
  propertyOrdering: [
    "recognized",
    "scale_reasoning",
    "name",
    "components",
    "portion_min_g",
    "portion_max_g",
    "estimated_portion_g",
    "kcal_100g",
    "protein_g_100g",
    "carbs_g_100g",
    "fat_g_100g",
    "fiber_g_100g",
    "confidence",
  ],
};

const SYSTEM_PROMPT = `Sos un nutricionista experto que estima la información nutricional de comidas a partir de una foto.

Seguí este orden de razonamiento (es clave para acertar la porción):
1. ESCALA PRIMERO (scale_reasoning): antes de dar cualquier número, identificá referencias de tamaño en la imagen y escribilas. Referencias útiles: diámetro típico de un plato playo (~26-28cm) o de postre (~20cm), cubiertos (un tenedor ~19cm), un vaso/lata (lata ~330ml, alto ~12cm), una mano. Deducí de ahí qué superficie y volumen ocupa cada cosa.
2. DESGLOSE (components): separá el plato en sus componentes/alimentos visibles. Cada componente debe ser un alimento INDIVIDUAL y BUSCABLE (ej: "Milanesa de carne", "Puré de papa", "Arroz blanco"), NO una descripción del plato entero. Para cada uno estimá sus gramos por separado (es mucho más preciso) y sus calorías y macros por cada 100g (valores estándar de tablas nutricionales). Un alimento simple (ej: una manzana) es un solo componente.
3. TOTAL: estimated_portion_g debe ser aproximadamente la suma de los componentes. Dá también un rango plausible (portion_min_g / portion_max_g) que refleje tu incertidumbre real.
4. MACROS DEL PLATO (kcal_100g y macros de nivel raíz): calorías y macros por cada 100g del plato completo (promedio ponderado de los componentes).

Si la imagen NO contiene comida identificable, devolvé recognized=false, scale_reasoning="", components=[] y el resto en 0.
Sé realista y conservador. Todos los valores numéricos deben ser >= 0.`;

function numberFrom(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Slug estable a partir del nombre, para deduplicar alimentos de IA por nombre. */
function slugifyName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  const userClient = await createServerSupabase();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar GEMINI_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  if (!(await consumeRateLimit(userClient, user.id, "food_photo", RATE_LIMIT_MAX))) {
    return NextResponse.json(
      { error: "Demasiadas fotos seguidas. Esperá un momento." },
      { status: 429 }
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("photo");
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: "No pudimos leer la imagen." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No se envió ninguna foto." }, { status: 400 });
  }
  if (!ALLOWED_MEDIA.has(file.type)) {
    return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado grande (máx 6MB)." }, { status: 413 });
  }

  // Techo global diario: corta TODAS las llamadas a Gemini al llegar al tope,
  // para no superar el free tier ni generar cargos. Se chequea recién acá,
  // sobre requests válidas, para no gastar cupo en fotos rechazadas.
  if (!(await consumeGlobalDailyCap(userClient, "gemini_photo", GEMINI_DAILY_CAP))) {
    return NextResponse.json(
      { error: "El análisis por foto alcanzó el límite diario. Probá de nuevo mañana o cargá el alimento manualmente." },
      { status: 429 }
    );
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const ai = new GoogleGenAI({ apiKey });

  let result: VisionResult;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: "Identificá este alimento y estimá sus calorías y macros." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: VISION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Respuesta vacía del modelo");
    }
    result = JSON.parse(text) as VisionResult;
  } catch (err) {
    console.error("photo vision error", err);
    return NextResponse.json(
      { error: "No pudimos analizar la foto. Probá de nuevo o cargala manualmente." },
      { status: 502 }
    );
  }

  if (!result.recognized || !result.name) {
    return NextResponse.json(
      { error: "No reconocimos comida en la foto. Probá con otra toma." },
      { status: 422 }
    );
  }

  const supabase = adminClient();
  const confidence = Math.min(1, Math.max(0, numberFrom(result.confidence)));
  const dishName = result.name.trim();
  const portionMin = Math.round(numberFrom(result.portion_min_g)) || null;
  const portionMax = Math.round(numberFrom(result.portion_max_g)) || null;

  const foodCols =
    "id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name";

  // Normalizamos los componentes que devolvió la IA (nombre + gramos + macros
  // propios). Si no devolvió ninguno, sintetizamos uno solo con el plato entero.
  const MAX_COMPONENTS = 8;
  type RawComp = {
    name: string;
    estimated_g: number;
    nutrition: {
      kcal_100g: number;
      protein_g_100g: number;
      carbs_g_100g: number;
      fat_g_100g: number;
      fiber_g_100g: number;
    };
  };
  const round1 = (v: unknown) => Math.round(numberFrom(v) * 10) / 10;
  let rawComponents: RawComp[] = (Array.isArray(result.components) ? result.components : [])
    .map((c) => ({
      name: String(c?.name ?? "").trim(),
      estimated_g: Math.round(numberFrom(c?.estimated_g)),
      nutrition: {
        kcal_100g: round1(c?.kcal_100g),
        protein_g_100g: round1(c?.protein_g_100g),
        carbs_g_100g: round1(c?.carbs_g_100g),
        fat_g_100g: round1(c?.fat_g_100g),
        fiber_g_100g: round1(c?.fiber_g_100g),
      },
    }))
    .filter((c) => c.name && c.estimated_g > 0)
    .slice(0, MAX_COMPONENTS);

  if (rawComponents.length === 0) {
    rawComponents = [
      {
        name: dishName,
        estimated_g: Math.round(numberFrom(result.estimated_portion_g)) || 100,
        nutrition: {
          kcal_100g: round1(result.kcal_100g),
          protein_g_100g: round1(result.protein_g_100g),
          carbs_g_100g: round1(result.carbs_g_100g),
          fat_g_100g: round1(result.fat_g_100g),
          fiber_g_100g: round1(result.fiber_g_100g),
        },
      },
    ];
  }

  // Fuente AI: la creamos perezosamente, sólo si algún componente no matchea el
  // catálogo y hay que persistir un alimento de IA.
  let cachedSourceId: number | null = null;
  async function ensureSource(): Promise<number | null> {
    if (cachedSourceId != null) return cachedSourceId;
    const { data } = await supabase
      .from("food_sources")
      .upsert(
        {
          code: AI_SOURCE_CODE,
          name: "Kilo AI (foto)",
          source_type: "manual",
          refresh_strategy: "on_photo_analysis",
          priority: 30,
          is_active: true,
        },
        { onConflict: "code" }
      )
      .select("id")
      .single();
    cachedSourceId = data?.id ?? null;
    return cachedSourceId;
  }

  // Matching contra el catálogo del usuario: buscamos candidatos por tokens y
  // puntuamos por solapamiento de palabras (ignorando conectores). Preferimos
  // usar un alimento REAL/verificado antes que inventar macros.
  const STOP = new Set(["de", "con", "y", "a", "la", "el", "los", "las", "en", "al", "del", "un", "una"]);
  const contentTokens = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOP.has(t));

  function matchScore(detected: string, candidate: string): number {
    const dn = detected.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const cn = candidate.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    if (!dn || !cn) return 0;
    if (dn === cn) return 1;
    if (dn.includes(cn) || cn.includes(dn)) return 0.9;
    const dt = new Set(contentTokens(detected));
    const ct = contentTokens(candidate);
    if (dt.size === 0 || ct.length === 0) return 0;
    const inter = ct.filter((t) => dt.has(t)).length;
    return inter / Math.min(dt.size, ct.length); // fracción del set más chico cubierta
  }

  interface FoodRow {
    id: number;
    source_food_id: string | null;
    canonical_name: string;
    kcal_100g: number | null;
    protein_g_100g: number | null;
    carbs_g_100g: number | null;
    fat_g_100g: number | null;
    fiber_g_100g: number | null;
    default_portion_g: number | null;
    default_portion_name: string | null;
    is_verified?: boolean | null;
  }

  async function catalogMatch(name: string): Promise<FoodRow | null> {
    const toks = contentTokens(name);
    if (toks.length === 0) return null;
    const orFilter = toks.map((t) => `canonical_name.ilike.%${t}%`).join(",");
    const { data } = await supabase
      .from("foods")
      .select(`${foodCols}, is_verified`)
      .or(orFilter)
      .order("is_verified", { ascending: false })
      .limit(40);
    const rows = (data as FoodRow[] | null) ?? [];
    let best: FoodRow | null = null;
    let bestScore = 0;
    for (const r of rows) {
      const s = matchScore(name, r.canonical_name) + (r.is_verified ? 0.05 : 0);
      if (s > bestScore) {
        bestScore = s;
        best = r;
      }
    }
    return bestScore >= 0.6 ? best : null;
  }

  interface ResolvedComponent {
    detected_name: string;
    estimated_g: number;
    matched: boolean;
    is_verified: boolean;
    food: {
      id: number;
      source_food_id: string | null;
      canonical_name: string;
      kcal_100g: number | null;
      protein_g_100g: number | null;
      carbs_g_100g: number | null;
      fat_g_100g: number | null;
      fiber_g_100g: number | null;
      default_portion_g: number;
      default_portion_name: string;
      source_method: "photo";
    };
  }

  async function resolveComponent(comp: RawComp): Promise<ResolvedComponent | null> {
    const matched = await catalogMatch(comp.name);
    if (matched) {
      return {
        detected_name: comp.name,
        estimated_g: comp.estimated_g,
        matched: true,
        is_verified: !!matched.is_verified,
        food: {
          id: matched.id,
          source_food_id: matched.source_food_id,
          canonical_name: matched.canonical_name,
          kcal_100g: matched.kcal_100g,
          protein_g_100g: matched.protein_g_100g,
          carbs_g_100g: matched.carbs_g_100g,
          fat_g_100g: matched.fat_g_100g,
          fiber_g_100g: matched.fiber_g_100g,
          default_portion_g: comp.estimated_g,
          default_portion_name: "porción estimada",
          source_method: "photo",
        },
      };
    }

    // Sin match: persistimos un alimento de IA para este componente (dedup por
    // nombre vía onConflict) usando sus macros propios.
    const src = await ensureSource();
    if (src == null) return null;
    const sourceFoodId = `photo_${slugifyName(comp.name)}`;
    const { data: food } = await supabase
      .from("foods")
      .upsert(
        {
          source_id: src,
          source_food_id: sourceFoodId,
          canonical_name: comp.name,
          is_generic: true,
          is_recipe: false,
          is_verified: false,
          verification_status: "draft",
          confidence_score: confidence || 0.5,
          default_portion_name: "porción estimada",
          default_portion_g: comp.estimated_g,
          ...comp.nutrition,
          raw_payload: { source: "ai_vision", model: GEMINI_MODEL, dish: dishName, component: comp },
        },
        { onConflict: "source_id,source_food_id" }
      )
      .select(foodCols)
      .single<FoodRow>();
    if (!food) return null;
    return {
      detected_name: comp.name,
      estimated_g: comp.estimated_g,
      matched: false,
      is_verified: false,
      food: {
        id: food.id,
        source_food_id: food.source_food_id,
        canonical_name: food.canonical_name,
        kcal_100g: food.kcal_100g,
        protein_g_100g: food.protein_g_100g,
        carbs_g_100g: food.carbs_g_100g,
        fat_g_100g: food.fat_g_100g,
        fiber_g_100g: food.fiber_g_100g,
        default_portion_g: comp.estimated_g,
        default_portion_name: "porción estimada",
        source_method: "photo",
      },
    };
  }

  const resolvedRaw = await Promise.all(rawComponents.map(resolveComponent));
  const components = resolvedRaw.filter((c): c is ResolvedComponent => c !== null);

  if (components.length === 0) {
    return NextResponse.json(
      { error: "No se pudo preparar el alimento detectado. Probá de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    dish_name: dishName,
    confidence,
    portion_min_g: portionMin,
    portion_max_g: portionMax,
    components,
  });
}
