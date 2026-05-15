"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SheetState {
  isOpen: boolean;
  mealId: string | null;
}

interface SheetContextValue extends SheetState {
  openSheet: (mealId?: string) => void;
  closeSheet: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({ isOpen: false, mealId: null });

  const openSheet = (mealId?: string) =>
    setState({ isOpen: true, mealId: mealId ?? null });

  const closeSheet = () =>
    setState({ isOpen: false, mealId: null });

  return (
    <SheetContext.Provider value={{ ...state, openSheet, closeSheet }}>
      {children}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheet must be used within SheetProvider");
  return ctx;
}
