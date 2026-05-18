import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Nutriments = Record<string, number | string | undefined>;

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  ingredients_text?: string;
  image_front_url?: string;
  lang?: string;
  countries_tags?: string[];
  nutriments?: Nutriments;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

const OFF_SOURCE_CODE = "open_food_facts";

function numberFrom(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function macro(nutriments: Nutriments | undefined, key: string) {
  return numberFrom(nutriments?.[`${key}_100g`]) ?? 0;
}

function energyKcal(nutriments: Nutriments | undefined) {
  const kcal = numberFrom(nutriments?.["energy-kcal_100g"]);
  if (kcal != null) return kcal;

  const kj = numberFrom(nutriments?.["energy_100g"]);
  return kj != null ? kj / 4.184 : 0;
}

function gramsFromServing(label: string | undefined) {
  if (!label) return null;
  const match = label.match(/([\d]+(?:[,.]\d+)?)\s*g/i);
  if (!match) return null;
  return Number(match[1].replace(",", "."));
}

function gtinType(barcode: string) {
  if (barcode.length === 8) return "EAN8";
  if (barcode.length === 12) return "UPC";
  if (barcode.length === 13) return "EAN13";
  if (barcode.length === 14) return "GTIN14";
  return null;
}

function countryFrom(tags: string[] | undefined) {
  const ar = tags?.find((tag) => tag.toLowerCase().includes("argentina"));
  return ar ? "AR" : null;
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

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode")?.replace(/\D/g, "") ?? "";

  if (!/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: "Codigo de barras invalido" }, { status: 400 });
  }

  const fields = [
    "code",
    "product_name",
    "product_name_es",
    "generic_name",
    "brands",
    "quantity",
    "serving_size",
    "ingredients_text",
    "image_front_url",
    "lang",
    "countries_tags",
    "nutriments",
  ].join(",");

  const offRes = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`,
    {
      headers: {
        "User-Agent": "Kilo/0.1 (barcode lookup)",
      },
      next: { revalidate: 60 * 60 * 24 },
    }
  );

  if (!offRes.ok) {
    return NextResponse.json({ error: "No pudimos consultar Open Food Facts" }, { status: 502 });
  }

  const off = (await offRes.json()) as OpenFoodFactsResponse;
  const product = off.product;

  if (off.status !== 1 || !product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const name = product.product_name_es || product.product_name || product.generic_name;
  if (!name) {
    return NextResponse.json({ error: "El producto no tiene nombre cargado" }, { status: 422 });
  }

  const nutriments = product.nutriments ?? {};
  const servingGrams = gramsFromServing(product.serving_size);
  const defaultPortionG = servingGrams ?? 100;
  const brand = product.brands?.split(",")[0]?.trim() || null;

  const supabase = adminClient();

  const { data: source, error: sourceError } = await supabase
    .from("food_sources")
    .upsert(
      {
        code: OFF_SOURCE_CODE,
        name: "Open Food Facts",
        source_type: "community",
        base_url: "https://world.openfoodfacts.org",
        license_name: "Open Database License",
        license_url: "https://opendatacommons.org/licenses/odbl/1-0/",
        refresh_strategy: "on_barcode_scan",
        priority: 50,
        is_active: true,
      },
      { onConflict: "code" }
    )
    .select("id")
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: sourceError?.message ?? "No se pudo preparar la fuente" }, { status: 500 });
  }

  const nutrition = {
    kcal_100g: Math.round(energyKcal(nutriments) * 10) / 10,
    protein_g_100g: Math.round(macro(nutriments, "proteins") * 10) / 10,
    carbs_g_100g: Math.round(macro(nutriments, "carbohydrates") * 10) / 10,
    fat_g_100g: Math.round(macro(nutriments, "fat") * 10) / 10,
    fiber_g_100g: Math.round(macro(nutriments, "fiber") * 10) / 10,
    sugar_g_100g: Math.round(macro(nutriments, "sugars") * 10) / 10,
    sodium_mg_100g: Math.round(macro(nutriments, "sodium") * 100000),
  };

  const { data: food, error: foodError } = await supabase
    .from("foods")
    .upsert(
      {
        source_id: source.id,
        source_food_id: barcode,
        canonical_name: name,
        brand_name: brand,
        country_code: countryFrom(product.countries_tags),
        is_generic: false,
        is_recipe: false,
        is_verified: false,
        verification_status: "pending",
        confidence_score: 0.85,
        default_portion_name: product.serving_size ? "porcion" : "100g",
        default_portion_g: defaultPortionG,
        ...nutrition,
        raw_payload: product,
      },
      { onConflict: "source_id,source_food_id" }
    )
    .select("id, source_food_id, canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g, fiber_g_100g, default_portion_g, default_portion_name")
    .single();

  if (foodError || !food) {
    return NextResponse.json({ error: foodError?.message ?? "No se pudo guardar el alimento" }, { status: 500 });
  }

  const { data: barcodeProduct, error: barcodeError } = await supabase
    .from("barcode_products")
    .upsert(
      {
        barcode,
        food_id: food.id,
        source_id: source.id,
        gtin_type: gtinType(barcode),
        product_name: name,
        brand_name: brand,
        quantity_label: product.quantity ?? null,
        serving_size_label: product.serving_size ?? null,
        ingredients_text: product.ingredients_text ?? null,
        image_front_url: product.image_front_url ?? null,
        label_lang: product.lang ?? "es",
        is_official_label: false,
        last_synced_at: new Date().toISOString(),
        raw_payload: product,
      },
      { onConflict: "barcode" }
    )
    .select("id, barcode, product_name, brand_name, image_front_url")
    .single();

  if (barcodeError || !barcodeProduct) {
    return NextResponse.json({ error: barcodeError?.message ?? "No se pudo guardar el codigo" }, { status: 500 });
  }

  return NextResponse.json({
    food: {
      ...food,
      barcode_product_id: barcodeProduct.id,
      source_method: "barcode",
    },
    product: barcodeProduct,
  });
}
