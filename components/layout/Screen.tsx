"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  padBottom?: number;
  padTop?: number;
  scrollKey?: string | number;
}

export function Screen({ children, padBottom = 110, padTop = 0, scrollKey }: ScreenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [scrollKey]);

  return (
    <div
      ref={ref}
      className="kilo-screen-enter"
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        paddingTop: padTop,
        paddingBottom: padBottom,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}
