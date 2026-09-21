import { NextRequest, NextResponse } from "next/server";

const ALLOWED_SOURCES = new Set(["window.error", "unhandledrejection", "global-error"]);
const buckets = new Map<string, { count: number; resetAt: number }>();

function limited(request: NextRequest) {
  const now = Date.now();
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

function text(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max)
    : "";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
  }
  if (limited(request)) {
    return NextResponse.json({ error: "Demasiados reportes" }, { status: 429 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const source = text(raw.source, 40);
  if (!ALLOWED_SOURCES.has(source)) {
    return NextResponse.json({ error: "Fuente inválida" }, { status: 400 });
  }

  const event = {
    source,
    name: text(raw.name, 80) || "Error",
    message: text(raw.message, 300) || "Error desconocido",
    digest: text(raw.digest, 100) || undefined,
    path: text(raw.path, 200).split("?")[0] || "/",
  };

  // Vercel clasifica console.error como error en Runtime Logs. Deliberadamente
  // no guardamos stack, cookies, email, user-agent ni parámetros de la URL.
  console.error("[client-error]", JSON.stringify(event));
  return new NextResponse(null, { status: 204 });
}
