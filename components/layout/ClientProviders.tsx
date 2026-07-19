"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { SheetProvider } from "@/context/SheetContext";
import { ToastProvider } from "@/context/ToastContext";
import { AddFoodSheet } from "@/components/food/AddFoodSheet";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <SheetProvider>
          {children}
          <AddFoodSheet />
          <ServiceWorkerRegister />
        </SheetProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
