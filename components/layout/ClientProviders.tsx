"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { SheetProvider } from "@/context/SheetContext";
import { ToastProvider } from "@/context/ToastContext";
import { useSheet } from "@/context/SheetContext";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

const AddFoodSheet = dynamic(
  () => import("@/components/food/AddFoodSheet").then((module) => module.AddFoodSheet),
  { ssr: false }
);

function DeferredAddFoodSheet() {
  const { isOpen } = useSheet();
  return isOpen ? <AddFoodSheet /> : null;
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <SheetProvider>
          {children}
          <DeferredAddFoodSheet />
          <ServiceWorkerRegister />
        </SheetProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
