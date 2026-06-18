"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Screen } from "@/components/layout/Screen";
import { SectionHead } from "@/components/ui/SectionHead";
import { useReminders, type ReminderKind, type Reminder } from "@/hooks/useReminders";
import {
  pushSupported,
  ensurePermission,
  getOrSubscribe,
  unsubscribePush,
  arrayBufferToBase64,
} from "@/lib/push";

const KIND_LABELS: Record<ReminderKind, { label: string; emoji: string }> = {
  meal:   { label: "Comida",       emoji: "🍽️" },
  water:  { label: "Agua",         emoji: "💧" },
  habit:  { label: "Hábito",       emoji: "✅" },
  weight: { label: "Pesarte",      emoji: "⚖️" },
  custom: { label: "Personalizado", emoji: "🔔" },
};

const DAYS = [
  { i: 1, l: "L" }, { i: 2, l: "M" }, { i: 3, l: "M" }, { i: 4, l: "J" },
  { i: 5, l: "V" }, { i: 6, l: "S" }, { i: 7, l: "D" },
];

export default function RemindersPage() {
  const router = useRouter();
  const { reminders, loading, createReminder, updateReminder, deleteReminder } = useReminders();

  const [pushState, setPushState] = useState<"unsupported" | "denied" | "off" | "on" | "loading" | "error">("loading");
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) { setPushState("unsupported"); return; }
    if (Notification.permission === "denied") { setPushState("denied"); return; }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((s) => setPushState(s ? "on" : "off"))
      .catch(() => setPushState("error"));
  }, []);

  async function enablePush() {
    setPushMsg(null);
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) { setPushState("error"); setPushMsg("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en el front."); return; }
    setPushState("loading");
    try {
      const perm = await ensurePermission();
      if (perm !== "granted") {
        setPushState(perm === "denied" ? "denied" : "off");
        setPushMsg(perm === "denied" ? "Habilitá notificaciones desde los ajustes del navegador." : null);
        return;
      }
      const sub = await getOrSubscribe(vapid);
      if (!sub) { setPushState("error"); setPushMsg("No pudimos suscribirnos."); return; }
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
            auth:   arrayBufferToBase64(sub.getKey("auth")),
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPushState("error"); setPushMsg(err?.error ?? "Error guardando suscripción."); return;
      }
      setPushState("on");
    } catch (err) {
      setPushState("error");
      setPushMsg(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  async function disablePush() {
    setPushMsg(null);
    setPushState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      await unsubscribePush();
      if (endpoint) {
        await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, { method: "DELETE" });
      }
      setPushState("off");
    } catch {
      setPushState("error");
      setPushMsg("No pudimos desuscribirnos.");
    }
  }

  async function sendTest() {
    setPushMsg(null);
    const res = await fetch("/api/notifications/test", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setPushMsg(json?.error ?? `Error ${res.status}`);
    else setPushMsg(`Enviada a ${json.sent} dispositivo(s).`);
  }

  return (
    <AppShell>
      <Screen scrollKey="reminders">
        <div style={{ padding: "0 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/profile")}
            aria-label="Volver"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: "var(--bg-1)", border: "1px solid var(--line-1)",
              cursor: "pointer", color: "var(--text-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}
          >←</button>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500,
            letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0,
          }}>Recordatorios</h1>
        </div>

        {/* Push state card */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{
            background: "var(--bg-1)", border: "1px solid var(--line-1)",
            borderRadius: 18, padding: 16,
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)",
              letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
            }}>NOTIFICACIONES PUSH</div>

            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
              {pushState === "on" && "Listo. Recibís recordatorios en este dispositivo."}
              {pushState === "off" && "Activá las notificaciones para que te avise."}
              {pushState === "denied" && "Las notificaciones están bloqueadas. Habilitalas en los ajustes del navegador."}
              {pushState === "unsupported" && "Tu navegador no soporta notificaciones push (instalá la app desde el menú \"Compartir\" en iOS)."}
              {pushState === "loading" && "Cargando…"}
              {pushState === "error" && (pushMsg ?? "Algo falló.")}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {pushState === "off" && (
                <button onClick={enablePush} style={primaryBtn}>Activar</button>
              )}
              {pushState === "on" && (
                <>
                  <button onClick={sendTest} style={secondaryBtn}>Enviar test</button>
                  <button onClick={disablePush} style={secondaryBtn}>Desactivar</button>
                </>
              )}
              {pushState === "error" && (
                <button onClick={enablePush} style={secondaryBtn}>Reintentar</button>
              )}
            </div>

            {pushMsg && pushState !== "error" && (
              <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                {pushMsg}
              </div>
            )}
          </div>
        </div>

        <SectionHead title="Tus recordatorios" />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Cargando…</div>
          ) : reminders.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No tenés recordatorios todavía.
            </div>
          ) : reminders.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              onToggle={(enabled) => updateReminder(r.id, { enabled })}
              onDelete={() => {
                if (window.confirm(`¿Borrar "${r.label}"?`)) deleteReminder(r.id);
              }}
            />
          ))}

          <NewReminderForm onCreate={createReminder} />
        </div>

        <div style={{ padding: "20px 20px 32px", fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
          Los recordatorios se guardan acá. Para que efectivamente lleguen como notificación,
          el backend debe disparar el envío en el horario configurado (ver instrucciones de despliegue).
        </div>
      </Screen>
    </AppShell>
  );
}

function ReminderRow({ reminder, onToggle, onDelete }: {
  reminder: Reminder;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const k = KIND_LABELS[reminder.kind];
  const days = reminder.days_of_week;
  const everyday = days.length === 7;

  return (
    <div style={{
      background: "var(--bg-1)", border: "1px solid var(--line-1)",
      borderRadius: 14, padding: 14,
      display: "flex", alignItems: "center", gap: 12,
      opacity: reminder.enabled ? 1 : 0.55,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: "var(--bg-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>{k.emoji}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>{reminder.label}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
          {reminder.time_of_day.slice(0, 5)} · {everyday ? "todos los días" : `${days.length} días`}
        </div>
      </div>

      <label style={{ position: "relative", display: "inline-block", width: 38, height: 22 }}>
        <input
          type="checkbox"
          checked={reminder.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ display: "none" }}
        />
        <span style={{
          position: "absolute", inset: 0,
          background: reminder.enabled ? "var(--lime)" : "var(--bg-2)",
          borderRadius: 100, cursor: "pointer", transition: "background 0.15s",
          border: "1px solid var(--line-2)",
        }} />
        <span style={{
          position: "absolute", top: 2, left: reminder.enabled ? 18 : 2,
          width: 16, height: 16, background: "var(--text-1)", borderRadius: "50%",
          transition: "left 0.15s",
        }} />
      </label>

      <button
        onClick={onDelete}
        aria-label="Borrar"
        style={{
          width: 24, height: 24, background: "transparent",
          border: "none", color: "var(--text-3)", fontSize: 16, cursor: "pointer", opacity: 0.6,
        }}
      >×</button>
    </div>
  );
}

function NewReminderForm({ onCreate }: {
  onCreate: (r: { kind: ReminderKind; label: string; time_of_day: string; days_of_week: number[]; enabled: boolean }) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ReminderKind>("meal");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("12:00");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setKind("meal"); setLabel(""); setTime("12:00");
    setDays([1, 2, 3, 4, 5, 6, 7]); setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || days.length === 0) return;
    setSaving(true); setErr(null);
    const res = await onCreate({
      kind, label: label.trim(),
      time_of_day: `${time}:00`,
      days_of_week: [...days].sort((a, b) => a - b),
      enabled: true,
    });
    setSaving(false);
    if (res.error) setErr(res.error);
    else { setOpen(false); reset(); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="kilo-pressable"
        style={{
          background: "transparent", border: "1.5px dashed var(--line-2)",
          borderRadius: 14, padding: "14px 16px", cursor: "pointer",
          color: "var(--text-2)", fontSize: 13, fontWeight: 500,
        }}
      >
        + Nuevo recordatorio
      </button>
    );
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    background: "var(--bg-2)", border: "1px solid var(--line-2)",
    borderRadius: 10, color: "var(--text-1)",
    fontSize: 13.5, fontFamily: "var(--font-body)", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={submit} style={{
      background: "var(--bg-1)", border: "1px solid var(--lime)",
      borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(Object.keys(KIND_LABELS) as ReminderKind[]).map((k) => (
          <button
            type="button" key={k} onClick={() => setKind(k)}
            style={{
              padding: "6px 10px", borderRadius: 100,
              background: kind === k ? "var(--lime)" : "var(--bg-2)",
              color: kind === k ? "#0a0d15" : "var(--text-2)",
              border: "1px solid var(--line-2)",
              fontSize: 11.5, cursor: "pointer", fontWeight: 600,
            }}
          >
            {KIND_LABELS[k].emoji} {KIND_LABELS[k].label}
          </button>
        ))}
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Etiqueta (ej. Almuerzo)"
        style={input}
      />

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Hora</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{ ...input, flex: 1, fontFamily: "var(--font-mono)" }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
        {DAYS.map((d) => {
          const on = days.includes(d.i);
          return (
            <button
              type="button" key={d.i}
              onClick={() => setDays(on ? days.filter((x) => x !== d.i) : [...days, d.i])}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: on ? "var(--lime)" : "var(--bg-2)",
                color: on ? "#0a0d15" : "var(--text-2)",
                border: "1px solid var(--line-2)", cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
              }}
            >{d.l}</button>
          );
        })}
      </div>

      {err && (
        <div style={{
          fontSize: 11.5, color: "var(--red)", fontFamily: "var(--font-mono)",
          background: "rgba(255,107,107,0.08)", padding: "8px 10px",
          border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8,
        }}>{err}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving || !label.trim() || days.length === 0}
          style={{
            flex: 1, padding: "10px 0",
            background: "var(--lime)", border: "none",
            borderRadius: 10, color: "#0a0d15",
            fontSize: 12.5, fontWeight: 700,
            cursor: "pointer",
            opacity: saving || !label.trim() || days.length === 0 ? 0.5 : 1,
          }}
        >{saving ? "Guardando…" : "Guardar"}</button>
        <button
          type="button"
          onClick={() => { setOpen(false); reset(); }}
          style={{
            padding: "10px 16px",
            background: "transparent", border: "1px solid var(--line-2)",
            borderRadius: 10, color: "var(--text-3)",
            fontSize: 12.5, cursor: "pointer",
          }}
        >Cancelar</button>
      </div>
    </form>
  );
}

const primaryBtn: React.CSSProperties = {
  flex: 1, padding: "10px 0",
  background: "var(--lime)", border: "none",
  borderRadius: 10, color: "#0a0d15",
  fontSize: 12.5, fontWeight: 700, cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: "10px 0",
  background: "var(--bg-2)", border: "1px solid var(--line-2)",
  borderRadius: 10, color: "var(--text-1)",
  fontSize: 12.5, fontWeight: 500, cursor: "pointer",
};
