"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

/** Friendly empty placeholder: big emoji, title, subtitle and optional CTA. */
export function EmptyState({ emoji, title, subtitle, action, children }: EmptyStateProps) {
  return (
    <div
      className="kilo-item-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "28px 24px",
        background: "var(--bg-1)",
        border: "1px dashed var(--line-2)",
        borderRadius: 20,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "var(--bg-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          marginBottom: 14,
        }}
      >
        {emoji}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5, maxWidth: 280 }}>
          {subtitle}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="kilo-pressable"
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "var(--lime)",
            border: "none",
            borderRadius: 12,
            color: "#0a0d15",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}
