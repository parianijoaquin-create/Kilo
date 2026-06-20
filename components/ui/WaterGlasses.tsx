"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

interface WaterGlassesProps {
  /** Number of glasses to show per cycle. */
  goal: number;
  /** How many glasses have been drunk in total (0..max). */
  filled: number;
  /** Absolute maximum number of glasses. */
  max: number;
  /** Called with the new total count when a glass is tapped. */
  onChange: (next: number) => void;
}

// Cup outline (narrower at the bottom), used both as the glass and the water clip.
const CUP_CLIP = "polygon(16% 0, 84% 0, 73% 100%, 27% 100%)";

export function WaterGlasses({ goal, filled, max, onChange }: WaterGlassesProps) {
  const [splash, setSplash] = useState<number | null>(null);
  const prevFilled = useRef(filled);

  // Glasses already finished as full cycles (these reset the row to empty).
  const completedCycles = Math.floor(filled / goal);
  // How many cups are filled in the current row (a completed cycle shows empty).
  const visibleFilled = filled - completedCycles * goal;

  useEffect(() => {
    // Buzz on every completed cycle (e.g. 8 and 16 glasses).
    if (filled > prevFilled.current && filled % goal === 0) {
      haptic("success");
    }
    prevFilled.current = filled;
  }, [filled, goal]);

  function handleTap(i: number) {
    const next =
      i + 1 === visibleFilled
        ? completedCycles * goal + i // tap the last filled cup to remove it
        : Math.min(completedCycles * goal + i + 1, max);
    if (next > filled) {
      setSplash(i);
      setTimeout(() => setSplash((s) => (s === i ? null : s)), 450);
      haptic("tap");
    }
    onChange(next);
  }

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
      {Array.from({ length: goal }).map((_, i) => {
        const isFilled = i < visibleFilled;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Vaso ${i + 1}${isFilled ? " (lleno)" : ""}`}
            onClick={() => handleTap(i)}
            className={`kilo-pressable${splash === i ? " kilo-pop" : ""}`}
            style={{
              flex: 1,
              height: 46,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                clipPath: CUP_CLIP,
                background: "var(--bg-2)",
                overflow: "hidden",
              }}
            >
              {/* water */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: isFilled ? "100%" : "0%",
                  background: "linear-gradient(180deg, #6FA8FF 0%, var(--blue) 100%)",
                  transition: "height 450ms cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                {/* wavy surface */}
                {isFilled && (
                  <div
                    className="kilo-water-wave"
                    style={{
                      position: "absolute",
                      top: -4,
                      left: 0,
                      width: "150%",
                      height: 8,
                      borderRadius: "50%",
                      background: "#9CC4FF",
                      opacity: 0.7,
                    }}
                  />
                )}
              </div>
              {/* glass rim highlight */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: isFilled ? "rgba(255,255,255,0.35)" : "var(--line-1)",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
