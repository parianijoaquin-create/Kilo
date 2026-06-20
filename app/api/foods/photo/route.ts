import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { GoogleGenAI, Type } from "@google/genai";

const AI_SOURCE_CODE = "ai_vision";
const GEMINI_MODEL = "gemini-2.5-flash";

// Simple per-user rate limit: max 15 photo analyses per minute.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 15;
const rateBuckets = new Map<string, number[]>();

function checkRate(userId: string) {
  const now = Date.now();
  const recent = (rateBuckets.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateBuckets.set(userId, recent);
  return true;
}

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 6 * 1024 * 1024; // 6MB

interface VisionResult {
  recognized: boolean;
  name: string;
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
    name: {
      type: Type.STRING,
      description: "Nombre del plato en español, conciso (ej: 'Milanesa con puré', 'Ensalada César')",
    },
    estimated_portion_g: {
      type: Type.NUMBER,
      description: "Peso total estimado de la porción visible en gramos",
    },
    kcal_100g: { type: Type.NUMBER, description: "Calorías por cada 100g" },
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
    "name",
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
    "name",
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
Analizá la imagen e identificá el alimento o plato principal. Estimá:
- El peso total de la porción visible en gramos (considerá el tamaño del plato/recipiente como referencia).
- Los macros y calorías por cada 100 gramos del alimento (valores estándar de tablas nutricionales).
Si la imagen NO contiene comida identificable, devolvé recognized=false y el resto en 0.
Sé realista y conservador. Todos los valores numéricos deben ser >= 0.`;

function numberFrom(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
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

  if (!checkRate(user.id)) {
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

  const portionG = Math.round(numberFrom(result.estimated_portion_g)) || 100;
  const nutrition = {
    kcal_100g: Math.round(numberFrom(result.kcal_100g) * 10) / 10,
    protein_g_100g: Math.round(numberFrom(result.protein_g_100g) * 10) / 10,
    carbs_g_100g: Math.round(numberFrom(result.carbs_g_100g) * 10) / 10,
    fat_g_100g: Math.round(numberFrom(result.fat_g_100g) * 10) / 10,
    fiber_g_100g: Math.round(numberFrom(result.fiber_g_100g) * 10) / 10,
  };

  const supabase = adminClient();

  const { data: source, error: sourceError } = await supabase
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

  if (sourceError || !source) {
    return NextResponse.json(
      { error: sourceError?.message ?? "No se pudo preparar la fuente" },
      { status: 500 }
    );
  }

  const sourceFoodId = `photo_${user.id}_${Date.now()}`;
  const confidence = Math.min(1, Math.max(0, numberFrom(result.confidence)));

  const { data: food, error: foodError } = await supabase
    .from("foods")
    .upsert(
      {
        source_id: source.id,
        source_food_id: sourceFoodId,
        canonical_name: result.name.trim(),
        is_generic: true,
        is_recipe: false,
        is_verified: false,
        verification_status: "draft",
        confidence_score: confidence || 0.5,
        default_portion_name: "porción estimada",
        default_portion_g: portionG,
        ...nutrition,
        raw_payload: { source: "ai_vision", model: GEMINI_MODEL, ...result },
      },
      { onConflict: "source_id,source_food_id" }
    )
    .select(
      "id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name"
    )
    .single();

  if (foodError || !food) {
    return NextResponse.json(
      { error: foodError?.message ?? "No se pudo guardar el alimento" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    food: {
      ...food,
      source_method: "photo",
    },
    confidence,
  });
}
