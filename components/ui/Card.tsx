"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  accent?: boolean;
  className?: string;
}

export function Card({ children, style, onClick, accent, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      onMouseDown={onClick ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; } : undefined}
      onMouseUp={onClick ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; } : undefined}
      onMouseLeave={onClick ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; } : undefined}
      onTouchStart={onClick ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; } : undefined}
      onTouchEnd={onClick ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; } : undefined}
      style={{
        background: "var(--bg-1)",
        border: `1px solid ${accent ? "rgba(198,255,80,0.25)" : "var(--line-1)"}`,
        borderRadius: 22,
        padding: 18,
        cursor: onClick ? "pointer" : "default",
        transition: "transform var(--motion-tap), opacity var(--motion-tap), border-color var(--motion-state)",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
