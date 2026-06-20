"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { IconClose } from "@/components/icons";
import { haptic } from "@/lib/haptics";

const REVEAL = 80;            // px the row rests at once "armed"
const ARM_THRESHOLD = 44;     // drag past this to reveal the cross
const DELETE_THRESHOLD = 150; // drag past this in one go to delete
const SECOND_SWIPE = REVEAL + 34; // when armed, drag past this to delete

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  /** Border radius of the wrapped card, so the red layer matches. */
  radius?: number | string;
  /** Short word shown next to the cross, e.g. "Eliminar". */
  label?: string;
  /** Disable the gesture (e.g. while the row is in edit mode). */
  disabled?: boolean;
}

export function SwipeToDelete({
  children,
  onDelete,
  radius = 20,
  label = "Eliminar",
  disabled = false,
}: SwipeToDeleteProps) {
  const [dx, setDx] = useState(0);
  const [armed, setArmed] = useState(false);
  const [removing, setRemoving] = useState(false);

  const dragging = useRef(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const startDx = useRef(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const triggerDelete = useCallback(() => {
    if (removing) return;
    haptic("delete");
    setHeight(wrapRef.current?.offsetHeight);
    // next frame: collapse
    requestAnimationFrame(() => {
      setRemoving(true);
      setDx(-window.innerWidth);
    });
    window.setTimeout(onDelete, 240);
  }, [onDelete, removing]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || removing) return;
    dragging.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startDx.current = dx;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 6) {
      moved.current = true;
      // start capturing so the drag survives leaving the element
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    }
    let next = startDx.current + delta;
    if (next > 0) next = 0; // can't pull past the right edge
    if (next < -REVEAL) next = -REVEAL + (next + REVEAL) * 0.4; // rubber band
    setDx(next);
  };

  const settle = () => {
    if (!dragging.current) return;
    dragging.current = false;

    if (armed) {
      if (dx <= -SECOND_SWIPE) return triggerDelete();
      if (dx > -ARM_THRESHOLD) {
        setArmed(false);
        setDx(0);
        return;
      }
      setDx(-REVEAL);
      return;
    }

    if (dx <= -DELETE_THRESHOLD) return triggerDelete();
    if (dx <= -ARM_THRESHOLD) {
      if (!armed) haptic("arm");
      setArmed(true);
      setDx(-REVEAL);
      return;
    }
    setDx(0);
  };

  const reset = () => {
    if (armed && !moved.current) {
      setArmed(false);
      setDx(0);
    }
  };

  const revealRatio = Math.min(1, Math.abs(dx) / REVEAL);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        borderRadius: radius,
        overflow: "hidden",
        touchAction: "pan-y",
        maxHeight: removing ? 0 : height,
        opacity: removing ? 0 : 1,
        marginBottom: removing ? -10 : 0,
        transition: removing
          ? "max-height 240ms ease, opacity 200ms ease, margin-bottom 240ms ease"
          : undefined,
      }}
    >
      {/* Red delete layer behind the card */}
      <button
        type="button"
        aria-label="Eliminar"
        onClick={triggerDelete}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          paddingRight: 26,
          background: `linear-gradient(90deg, transparent 0%, rgba(255,107,107,${0.12 + revealRatio * 0.18}) 40%, var(--red) 100%)`,
          color: "#fff",
          cursor: "pointer",
          pointerEvents: armed ? "auto" : "none",
        }}
      >
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            transform: `scale(${0.6 + revealRatio * 0.4})`,
            opacity: revealRatio,
          }}
        >
          <IconClose size={22} color="#fff" strokeWidth={2.4} />
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
        </span>
      </button>

      {/* Foreground card */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={settle}
        onPointerCancel={settle}
        onClickCapture={(e) => {
          // if the user dragged, swallow the click so toggles don't fire
          if (moved.current) {
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
          } else {
            reset();
          }
        }}
        style={{
          position: "relative",
          transform: `translateX(${dx}px)`,
          transition: dragging.current ? "none" : "transform 260ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
