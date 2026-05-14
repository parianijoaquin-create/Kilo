"use client";

import type { ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: string;
}

export function Sheet({ open, onClose, children, height = "78%" }: SheetProps) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity var(--motion-fade)",
          zIndex: 60,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: open ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(100%)",
          width: "100%",
          maxWidth: 390,
          height,
          background: "var(--bg-1)",
          borderTop: "1px solid var(--line-1)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          zIndex: 61,
          transition: "transform var(--motion-sheet)",
          boxShadow: "0 -20px 40px rgba(0,0,0,.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, background: "var(--line-2)", borderRadius: 2 }} />
        </div>
        {children}
      </div>
    </>
  );
}
