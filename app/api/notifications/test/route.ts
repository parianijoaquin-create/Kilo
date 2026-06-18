import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

function configured() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return null;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (!configured()) {
    return NextResponse.json(
      { error: "Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT en el server." },
      { status: 503 }
    );
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ error: "No tenés dispositivos suscriptos." }, { status: 404 });

  let body = "¡Funciona! Las notificaciones de Kilo están activas.";
  try {
    const json = (await request.json()) as { body?: string };
    if (json?.body) body = json.body;
  } catch { /* ignore */ }

  const payload = JSON.stringify({
    title: "Kilo",
    body,
    url: "/dashboard",
    tag: "kilo-test",
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number } | null)?.statusCode;
      if (status === 404 || status === 410) stale.push(s.endpoint);
    }
  }));

  if (stale.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({ ok: true, sent, pruned: stale.length });
}
