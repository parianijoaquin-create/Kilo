"use client";

interface BarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  glow?: boolean;
  animate?: boolean;
}

export function Bar({ value, max, color = "var(--lime)", height = 6, glow = false, animate = true }: BarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      style={{
        height,
        background: "var(--bg-2)",
        borderRadius: height / 2,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: height / 2,
          boxShadow: glow ? `0 0 10px ${color}88` : "none",
          transition: animate ? "width 1s cubic-bezier(0.22,1,0.36,1)" : "none",
        }}
      />
    </div>
  );
}
