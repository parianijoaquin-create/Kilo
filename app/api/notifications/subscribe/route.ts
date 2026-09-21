import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SubscribePayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function validSubscription(payload: SubscribePayload) {
  if (!payload?.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) return false;
  if (payload.endpoint.length > 2048 || payload.keys.p256dh.length > 512 || payload.keys.auth.length > 256) return false;
  try {
    return new URL(payload.endpoint).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let payload: SubscribePayload;
  try {
    payload = (await request.json()) as SubscribePayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!validSubscription(payload)) {
    return NextResponse.json({ error: "Subscription incompleta" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: payload.endpoint,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let endpoint: string | null = null;
  try {
    const payload = (await request.json()) as { endpoint?: unknown };
    if (typeof payload.endpoint === "string") endpoint = payload.endpoint;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!endpoint || endpoint.length > 2048) {
    return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
