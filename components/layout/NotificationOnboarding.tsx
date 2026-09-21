"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { pushSupported, subscribeCurrentDevice } from "@/lib/push";

const DISMISSED_KEY = "kilo:notification-onboarding-dismissed";
const INSTALL_HINT_KEY = "kilo:notification-install-hint-seen";

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export function NotificationOnboarding() {
  const { userId, loading: authLoading } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userId || typeof window === "undefined") return;
    if (localStorage.getItem(`${DISMISSED_KEY}:${userId}`) === "1") return;

    if ("Notification" in window && Notification.permission === "granted") {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapid && pushSupported()) subscribeCurrentDevice(vapid).catch(() => {});
      return;
    }
    if ("Notification" in window && Notification.permission === "denied") return;

    const iosNeedsInstall = isIos() && !isStandalone();
    if (iosNeedsInstall && sessionStorage.getItem(INSTALL_HINT_KEY) === "1") return;
    const timer = window.setTimeout(() => {
      setNeedsInstall(iosNeedsInstall);
      setVisible(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [authLoading, userId]);

  useEffect(() => {
    if (!visible) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstActionRef.current?.focus();
    return () => previousFocus?.focus();
  }, [visible, needsInstall]);

  function dismiss() {
    if (userId) localStorage.setItem(`${DISMISSED_KEY}:${userId}`, "1");
    setVisible(false);
  }

  function closeInstallHint() {
    sessionStorage.setItem(INSTALL_HINT_KEY, "1");
    setVisible(false);
  }

  async function enable() {
    setWorking(true);
    setError(null);
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("Las notificaciones todavía no están configuradas en el servidor.");
      if (!pushSupported()) throw new Error("Este dispositivo todavía no permite notificaciones para Kilo.");
      await subscribeCurrentDevice(vapid);
      setVisible(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos activar las notificaciones.");
    } finally {
      setWorking(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      needsInstall ? closeInstallHint() : dismiss();
      return;
    }
    if (event.key !== "Tab") return;

    const buttons = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
    );
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-onboarding-title"
      aria-describedby="notification-onboarding-description"
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.58)", padding: 12,
      }}
    >
      <div style={{
        width: "100%", maxWidth: 430, borderRadius: 24,
        background: "var(--bg-1)", border: "1px solid var(--line-2)",
        boxShadow: "0 22px 70px rgba(0,0,0,0.45)", padding: 20,
      }}>
        <div aria-hidden="true" style={{ fontSize: 30, marginBottom: 10 }}>🔔</div>
        <h2 id="notification-onboarding-title" style={{
          margin: 0, color: "var(--text-1)", fontFamily: "var(--font-display)",
          fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em",
        }}>
          No te pierdas ningún recordatorio
        </h2>

        {needsInstall ? (
          <>
            <p id="notification-onboarding-description" style={copyStyle}>
              En iPhone, Apple solo permite notificaciones web cuando Kilo está agregada a la pantalla de inicio.
            </p>
            <ol style={{ ...copyStyle, paddingLeft: 22 }}>
              <li>Tocá Compartir en Safari.</li>
              <li>Elegí “Agregar a inicio”.</li>
              <li>Abrí Kilo desde el nuevo ícono.</li>
            </ol>
            <button ref={firstActionRef} type="button" onClick={closeInstallHint} style={primaryButton}>Entendido</button>
          </>
        ) : (
          <>
            <p id="notification-onboarding-description" style={copyStyle}>
              Kilo te avisará cuando sea hora de comer, tomar agua, cumplir un hábito o registrar tu peso.
              Solo tenés que aceptar el permiso del sistema.
            </p>
            {error && <p role="alert" aria-live="assertive" style={{ ...copyStyle, color: "var(--red)" }}>{error}</p>}
            <button ref={firstActionRef} type="button" onClick={enable} disabled={working} style={{
              ...primaryButton, opacity: working ? 0.65 : 1,
            }}>
              {working ? "Activando…" : "Permitir notificaciones"}
            </button>
            <button type="button" onClick={dismiss} style={secondaryButton}>Ahora no</button>
          </>
        )}
      </div>
    </div>
  );
}

const copyStyle: React.CSSProperties = {
  margin: "12px 0 16px", color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.55,
};

const primaryButton: React.CSSProperties = {
  width: "100%", minHeight: 44, border: 0, borderRadius: 12, padding: "12px 16px",
  background: "var(--lime)", color: "#0a0d15", fontSize: 13.5,
  fontWeight: 700, cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  width: "100%", minHeight: 44, border: 0, padding: "11px 16px", background: "transparent",
  color: "var(--text-2)", fontSize: 12.5, cursor: "pointer",
};
