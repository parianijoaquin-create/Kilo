import type { ReactNode } from "react";

interface StatProps {
  value: ReactNode;
  unit?: string;
  size?: number;
  color?: string;
}

export function Stat({ value, unit, size = 48, color = "var(--text-1)" }: StatProps) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          color,
          lineHeight: 1,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </span>
      {unit && (
        <span
          style={{
            fontSize: size * 0.32,
            fontWeight: 500,
            color: "var(--text-3)",
            fontFamily: "var(--font-body)",
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}
