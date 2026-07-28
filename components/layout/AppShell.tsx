import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        maxWidth: 390,
        margin: "0 auto",
        minHeight: "100svh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-0)",
        isolation: "isolate",
      }}
    >
      {/* Scrim del status bar: en modo black-translucent el contenido sube
          bajo la barra de estado. Esta franja fija (espejo del BottomNav)
          enmascara cualquier contenido que se cuele al hacer overscroll,
          evitando que el header se solape con el reloj. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 390,
          height: "env(safe-area-inset-top, 0px)",
          background: "var(--bg-0)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 50,
          pointerEvents: "none",
        }}
      />
      {children}
      <BottomNav />
    </div>
  );
}
