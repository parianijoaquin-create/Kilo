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
      {children}
      <BottomNav />
    </div>
  );
}
