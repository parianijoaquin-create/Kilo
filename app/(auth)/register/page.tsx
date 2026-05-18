"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div style={{
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
            Crear cuenta
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
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
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
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
        </div>

        {/* Footer link */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-3)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "var(--lime)", fontWeight: 600, textDecoration: "none" }}>
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text-3)",
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
