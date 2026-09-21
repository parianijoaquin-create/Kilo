"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrorReporting";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "global-error", error.digest);
  }, [error]);

  return (
    <html lang="es-AR">
      <body style={{ margin: 0, background: "#06090F", color: "#F2F3F5", fontFamily: "system-ui" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <p style={{ color: "#C6FF50", fontWeight: 700 }}>kilo.</p>
            <h1 style={{ fontSize: 28 }}>Algo salió mal</h1>
            <p style={{ color: "#A7ABB5", lineHeight: 1.5 }}>
              El error fue registrado automáticamente. Podés intentar cargar esta pantalla otra vez.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: 12,
                padding: "12px 18px",
                background: "#C6FF50",
                color: "#0A0D15",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
