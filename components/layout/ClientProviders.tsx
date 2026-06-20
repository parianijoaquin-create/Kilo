"use client";

import type { ReactNode } from "react";
import { SheetProvider } from "@/context/SheetContext";
import { ToastProvider } from "@/context/ToastContext";
import { AddFoodSheet } from "@/components/food/AddFoodSheet";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SheetProvider>
        {children}
        <AddFoodSheet />
        <ServiceWorkerRegister />
      </SheetProvider>
    </ToastProvider>
  );
}
