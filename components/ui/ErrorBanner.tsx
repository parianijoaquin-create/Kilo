interface ErrorBannerProps {
  /** Mensaje a mostrar. Si es null/undefined el banner no se renderiza. */
  message?: string | null;
  /** Texto contextual opcional arriba del error (ej: "No pudimos cargar el diario"). */
  title?: string;
  /** Si se pasa, muestra un botón "Reintentar" que lo invoca. */
  onRetry?: () => void;
}

/**
 * Banner de error para estados de carga fallidos. Antes varias pantallas
 * (dashboard, macros) fallaban en silencio: si la query se caía, quedaban en
 * ceros o cargando para siempre sin avisar. Este componente hace visible el
 * fallo y ofrece reintentar.
 */
export function ErrorBanner({ message, title, onRetry }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        background: "rgba(255, 90, 90, 0.06)",
        border: "1px solid rgba(255, 90, 90, 0.25)",
        borderRadius: 16,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4 }}>{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            flexShrink: 0,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            color: "var(--text-1)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
