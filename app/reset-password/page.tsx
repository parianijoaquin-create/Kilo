"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const { userId, loading: authLoading, requestPasswordReset, updatePassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await requestPasswordReset(email);
    setSubmitting(false);
    if (error) {
      setError("No pudimos enviar el enlace. Verificá el email e intentá nuevamente.");
      return;
    }
    setSent(true);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError("El enlace venció o no se pudo actualizar la contraseña. Solicitá uno nuevo.");
      return;
    }
    setUpdated(true);
  }

  const title = updated ? "Contraseña actualizada" : userId ? "Nueva contraseña" : sent ? "Revisá tu email" : "Recuperar contraseña";

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 500, letterSpacing: "-0.05em" }}>
            kilo<span style={{ color: "var(--lime)" }}>.</span>
          </div>
        </div>
        <section style={cardStyle} aria-labelledby="reset-title">
          <h1 id="reset-title" style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: "0 0 20px" }}>{title}</h1>

          {authLoading ? (
            <div role="status" style={messageStyle}>Comprobando el enlace…</div>
          ) : updated ? (
            <div role="status" aria-live="polite">
              <div style={messageStyle}>Tu contraseña fue actualizada. Ya podés ingresar con la nueva.</div>
              <Link href="/login" style={linkButtonStyle}>Ir a ingresar</Link>
            </div>
          ) : userId ? (
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label htmlFor="reset-new-password" style={labelStyle}>Nueva contraseña</label>
                <input id="reset-new-password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="reset-confirm-password" style={labelStyle}>Repetir contraseña</label>
                <input id="reset-confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" minLength={8} style={inputStyle} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)", fontSize: 12 }}>
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                Mostrar contraseñas
              </label>
              {error && <div role="alert" style={errorStyle}>{error}</div>}
              <button type="submit" disabled={submitting} style={submitStyle}>{submitting ? "Guardando…" : "Guardar contraseña"}</button>
            </form>
          ) : sent ? (
            <div role="status" aria-live="polite">
              <div style={messageStyle}>Si existe una cuenta asociada a <strong>{email}</strong>, vas a recibir un enlace para elegir una contraseña nueva.</div>
              <button type="button" onClick={() => setSent(false)} style={secondaryStyle}>Usar otro email</button>
            </div>
          ) : (
            <form onSubmit={handleRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.5 }}>Te enviaremos un enlace seguro para crear una contraseña nueva.</p>
              <div>
                <label htmlFor="reset-email" style={labelStyle}>Email</label>
                <input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
              </div>
              {error && <div role="alert" style={errorStyle}>{error}</div>}
              <button type="submit" disabled={submitting} style={submitStyle}>{submitting ? "Enviando…" : "Enviar enlace"}</button>
            </form>
          )}
        </section>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}><Link href="/login" style={{ color: "var(--lime)", textDecoration: "none" }}>← Volver al ingreso</Link></p>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" };
const cardStyle: React.CSSProperties = { background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 24, padding: 28 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 8, fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--text-1)", fontSize: 15 };
const submitStyle: React.CSSProperties = { width: "100%", padding: 14, border: "none", borderRadius: 14, background: "var(--lime)", color: "#0a0d15", fontWeight: 700, cursor: "pointer" };
const secondaryStyle: React.CSSProperties = { width: "100%", marginTop: 16, padding: 12, borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--text-1)", cursor: "pointer" };
const linkButtonStyle: React.CSSProperties = { ...submitStyle, display: "block", boxSizing: "border-box", textAlign: "center", textDecoration: "none", marginTop: 16 };
const messageStyle: React.CSSProperties = { padding: "13px 15px", borderRadius: 12, background: "rgba(198,255,80,0.06)", border: "1px solid rgba(198,255,80,0.24)", color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.5 };
const errorStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: 10, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", color: "var(--red)", fontSize: 12.5 };
