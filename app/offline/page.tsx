export default function OfflinePage() {
  return (
    <main style={{
      minHeight: "100svh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 500, letterSpacing: "-0.05em" }}>
          kilo<span style={{ color: "var(--lime)" }}>.</span>
        </div>
        <h1 style={{ margin: "32px 0 10px", fontFamily: "var(--font-display)", fontSize: 24 }}>
          Estás sin conexión
        </h1>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.55 }}>
          Tus datos privados no se guardan como páginas offline. Reconectate para abrir el diario y sincronizar tus registros.
        </p>
        <a href="/dashboard" style={{
          display: "block",
          marginTop: 24,
          padding: 14,
          borderRadius: 14,
          background: "var(--lime)",
          color: "#0a0d15",
          fontWeight: 700,
          textDecoration: "none",
        }}>
          Reintentar
        </a>
      </div>
    </main>
  );
}
