"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface RingSegment {
  value: number;
  max: number;
  color: string;
}

interface MultiRingProps {
  size?: number;
  stroke?: number;
  segments: RingSegment[];
  track?: string;
  children?: ReactNode;
}

export function MultiRing({
  size = 180,
  stroke = 14,
  segments,
  track = "var(--bg-2)",
  children,
}: MultiRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const [t, setT] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setT(1), 100);
    return () => clearTimeout(id);
  }, []);

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
        {segments.map((s, i) => {
          const len = circumference * (s.value / s.max) * 0.32 * t;
          const base = (circumference / 3) * i;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-base}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray var(--motion-ring)" }}
            />
          );
        })}
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
