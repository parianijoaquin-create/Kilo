interface MacroChipProps {
  code: string;
  value: number | string;
  color?: string;
}

export function MacroChip({ code, value, color = "var(--text-2)" }: MacroChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px 3px 6px",
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 100,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 500,
        color: "var(--text-2)",
        letterSpacing: "-0.01em",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: `${color}22`,
          color,
          fontWeight: 700,
          fontSize: 9,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {code}
      </span>
      <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{value}</span>
    </span>
  );
}
