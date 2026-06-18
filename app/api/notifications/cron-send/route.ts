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

  const supabase = adminClient();
  const { weekday, hh, mm } = nowInTz();
  const target = `${hh}:${mm}`;

  // Match reminders firing this exact minute, today, enabled.
  const { data: reminders, error: rErr } = await supabase
    .from("reminders")
    .select("id, user_id, kind, label, time_of_day, days_of_week")
    .eq("enabled", true)
    .gte("time_of_day", `${target}:00`)
    .lte("time_of_day", `${target}:59`);

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const matched = (reminders ?? []).filter((r) => (r as ReminderRow).days_of_week.includes(weekday));
  if (matched.length === 0) {
    return NextResponse.json({ ok: true, target, weekday, matched: 0, sent: 0 });
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

  return NextResponse.json({
    ok: true,
    target, weekday,
    matched: matched.length,
    sent,
    pruned: stale.length,
  });
}
