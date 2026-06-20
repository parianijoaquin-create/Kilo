"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck } from "@/components/icons";
import { haptic } from "@/lib/haptics";

interface CheckToggleProps {
  done: boolean;
  onToggle: () => void;
  size?: number;
  /** Accent color when completed (circle fill + burst ring). */
  color?: string;
  checkColor?: string;
  "aria-label"?: string;
}

/**
 * Round complete/incomplete toggle that celebrates with a pop + expanding
 * ring + success haptic the moment it flips to "done".
 */
export function CheckToggle({
  done,
  onToggle,
  size = 36,
  color = "var(--lime)",
  checkColor = "#0a0d15",
  "aria-label": ariaLabel = "Marcar como hecho",
}: CheckToggleProps) {
  const [celebrate, setCelebrate] = useState(false);
  const prevDone = useRef(done);

  useEffect(() => {
    if (done && !prevDone.current) {
      setCelebrate(true);
      haptic("success");
      const t = setTimeout(() => setCelebrate(false), 520);
      prevDone.current = done;
      return () => clearTimeout(t);
    }
    prevDone.current = done;
  }, [done]);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={done}
      onClick={(e) => {
        e.stopPropagation();
        if (!done) haptic("tap");
        onToggle();
      }}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        color, // burst ring inherits this via currentColor
      }}
    >
      {celebrate && <span className="kilo-burst" />}
      <span
        className={celebrate ? "kilo-pop" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: done ? color : "transparent",
          border: done ? "none" : "1.5px solid var(--line-2)",
          transition: "background 160ms ease, border-color 160ms ease",
        }}
      >
        {done && (
          <span className="kilo-check-in" style={{ display: "flex" }}>
            <IconCheck size={size * 0.5} color={checkColor} strokeWidth={2.5} />
          </span>
        )}
      </span>
    </button>
  );
}
