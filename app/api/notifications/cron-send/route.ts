import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface ReminderRow {
  id: string;
  user_id: string;
  kind: string;
  label: string;
  time_of_day: string;
  days_of_week: number[];
  last_sent_at: string | null;
}

// Un recordatorio dispara como máximo una vez por día. Si ya se envió hace
// menos de esto, lo salteamos: evita duplicados cuando el cron externo corre
// cada 1, 5 o 10 minutos (la ventana se solapa entre corridas).
const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 h

function minutesOfDay(timeStr: string): number {
  const [h, m] = timeStr.split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan env vars de Supabase");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function vapidConfigured() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

/**
 * Returns the ISO weekday (1=Mon..7=Sun) in the user's local time zone.
 * Today we assume Argentina time. If users span timezones, store offset per profile.
 */
function nowInTz(tz = "America/Argentina/Buenos_Aires") {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    weekday: weekdayMap[get("weekday")],
    hh: get("hour"),
    mm: get("minute"),
  };
}

const KIND_EMOJI: Record<string, string> = {
  meal: "🍽️", water: "💧", habit: "✅", weight: "⚖️", custom: "🔔",
};

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.nextUrl.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!vapidConfigured()) {
    return NextResponse.json({ error: "VAPID no configurado" }, { status: 503 });
  }

  // Ventana en minutos: tolerá que el cron externo corra cada 1/5/10 min.
  const windowRaw = Number(request.nextUrl.searchParams.get("window") ?? "5");
  const windowMin = Math.min(60, Math.max(1, Number.isFinite(windowRaw) ? windowRaw : 5));

  const supabase = adminClient();
  const { weekday, hh, mm } = nowInTz();
  const target = `${hh}:${mm}`;
  const nowMin = Number(hh) * 60 + Number(mm);
  const nowMs = Date.now();

  // Traemos los habilitados de hoy y filtramos la ventana en memoria
  // (son pocos; evita líos de comparación de strings y cruce de medianoche).
  let reminders: Partial<ReminderRow>[] | null = null;
  let dedupEnabled = true;

  const withDedup = await supabase
    .from("reminders")
    .select("id, user_id, kind, label, time_of_day, days_of_week, last_sent_at")
    .eq("enabled", true);

  if (withDedup.error) {
    // Si la columna last_sent_at aún no existe (migración pendiente), seguimos
    // sin dedup en vez de romper. Corré sql/migrations_add_last_sent_at.sql.
    dedupEnabled = false;
    const fallback = await supabase
      .from("reminders")
      .select("id, user_id, kind, label, time_of_day, days_of_week")
      .eq("enabled", true);
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    reminders = fallback.data as Partial<ReminderRow>[];
  } else {
    reminders = withDedup.data as Partial<ReminderRow>[];
  }

  const matched = (reminders ?? []).filter((row) => {
    const r = row as ReminderRow;
    if (!r.days_of_week.includes(weekday)) return false;

    // ¿La hora programada cae dentro de los últimos `windowMin` minutos?
    const remMin = minutesOfDay(r.time_of_day);
    let due = remMin <= nowMin && remMin > nowMin - windowMin;
    if (nowMin - windowMin < 0) {
      // Ventana que cruza medianoche (ej: 00:03 con ventana 10).
      due = due || remMin > 1440 + (nowMin - windowMin);
    }
    if (!due) return false;

    // Dedup: ya enviado hace poco → no reenviar.
    if (dedupEnabled && r.last_sent_at && nowMs - new Date(r.last_sent_at).getTime() < DEDUP_WINDOW_MS) {
      return false;
    }
    return true;
  }) as ReminderRow[];

  if (matched.length === 0) {
    return NextResponse.json({ ok: true, target, weekday, window: windowMin, matched: 0, sent: 0 });
  }

  const userIds = [...new Set(matched.map((r) => (r as ReminderRow).user_id))];
  const { data: subs, error: sErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const subsByUser = new Map<string, SubRow[]>();
  for (const s of (subs ?? []) as (SubRow & { user_id: string })[]) {
    const arr = subsByUser.get(s.user_id) ?? [];
    arr.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    subsByUser.set(s.user_id, arr);
  }

  const stale: string[] = [];
  let sent = 0;

  await Promise.all(matched.map(async (r) => {
    const reminder = r as ReminderRow;
    const userSubs = subsByUser.get(reminder.user_id) ?? [];
    const payload = JSON.stringify({
      title: `${KIND_EMOJI[reminder.kind] ?? "🔔"} ${reminder.label}`,
      body: "Es hora de tu recordatorio en Kilo.",
      url: "/dashboard",
      tag: `kilo-reminder-${reminder.id}`,
    });

    await Promise.all(userSubs.map(async (s) => {
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
  }));

  if (stale.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  // Marcamos como enviados para que la próxima corrida (ventana solapada) no
  // los reprocese. Se libera solo al pasar DEDUP_WINDOW_MS (siguiente día).
  if (dedupEnabled) {
    await supabase
      .from("reminders")
      .update({ last_sent_at: new Date(nowMs).toISOString() })
      .in("id", matched.map((r) => r.id));
  }

  return NextResponse.json({
    ok: true,
    window: windowMin,
    target, weekday,
    matched: matched.length,
    sent,
    pruned: stale.length,
  });
}
