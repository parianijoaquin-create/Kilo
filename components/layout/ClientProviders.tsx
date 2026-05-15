"use client";

import type { ReactNode } from "react";
import { SheetProvider } from "@/context/SheetContext";
import { AddFoodSheet } from "@/components/food/AddFoodSheet";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SheetProvider>
      {children}
      <AddFoodSheet />
    </SheetProvider>
  );
}
