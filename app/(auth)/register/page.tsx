"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authErrorMessage } from "@/lib/authError";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp(email, password, name);
    if (error) {
      setError(authErrorMessage(error.code, error.message));
      setLoading(false);
      return;
    }

    if (needsEmailConfirmation) {
      setConfirmationEmail(email);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main style={{
      minHeight: "100svh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 48,
            fontWeight: 500,
            letterSpacing: "-0.05em",
            color: "var(--text-1)",
            lineHeight: 1,
          }}>
            kilo<span style={{ color: "var(--lime)" }}>.</span>
          </div>
          <div style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}>
            TU NUTRICIÓN, A TU RITMO
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-1)",
          border: "1px solid var(--line-1)",
          borderRadius: 24,
          padding: 28,
        }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--text-1)",
            margin: "0 0 24px",
          }}>
            {confirmationEmail ? "Revisá tu email" : "Crear cuenta"}
          </h2>

          {confirmationEmail ? (
            <div role="status" aria-live="polite">
              <div style={{
                padding: "14px 16px",
                background: "rgba(198,255,80,0.06)",
                border: "1px solid rgba(198,255,80,0.25)",
                borderRadius: 12,
                color: "var(--text-2)",
                fontSize: 13.5,
                lineHeight: 1.55,
              }}>
                Te enviamos un enlace de confirmación a <strong style={{ color: "var(--text-1)" }}>{confirmationEmail}</strong>.
                Confirmá tu cuenta y después ingresá para completar tu perfil.
              </div>
              <Link href="/login" style={{ ...submitBtn, display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                Ir a ingresar
              </Link>
            </div>
          ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="register-name" style={labelStyle}>Nombre</label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="register-email" style={labelStyle}>Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com"
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="register-password" style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 78 }}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  style={passwordToggleStyle}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" style={{
                padding: "10px 14px",
                background: "rgba(255,107,107,0.08)",
                border: "0.5px solid rgba(255,107,107,0.3)",
                borderRadius: 10,
                fontSize: 12.5,
                color: "var(--red)",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={submitBtn}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
          )}
        </div>

        {/* Footer link */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-3)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "var(--lime)", fontWeight: 600, textDecoration: "none" }}>
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text-2)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontFamily: "var(--font-mono)",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-2)",
  border: "1px solid var(--line-2)",
  borderRadius: 12,
  padding: "13px 16px",
  fontSize: 15,
  color: "var(--text-1)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.2s",
};

const submitBtn: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  background: "var(--lime)",
  border: "none",
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 700,
  color: "#0a0d15",
  cursor: "pointer",
  fontFamily: "var(--font-display)",
  letterSpacing: "-0.01em",
  marginTop: 6,
  transition: "opacity 0.15s",
};

const passwordToggleStyle: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: "var(--lime)",
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
  minWidth: 64,
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
