"use client";

import { useEffect, useState, type ReactNode } from "react";

interface RingProps {
  size?: number;
  stroke?: number;
  value: number;
  max: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  animate?: boolean;
}

export function Ring({
  size = 180,
  stroke = 14,
  value,
  max,
  color = "var(--lime)",
  track = "var(--bg-2)",
  children,
  animate = true,
}: RingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const targetPct = Math.min(1, value / max);
  const [animPct, setAnimPct] = useState(animate ? 0 : targetPct);

  useEffect(() => {
    if (!animate) {
      setAnimPct(targetPct);
      return;
    }
    const t = setTimeout(() => setAnimPct(targetPct), 100);
    return () => clearTimeout(t);
  }, [targetPct, animate]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - animPct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset var(--motion-ring)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
