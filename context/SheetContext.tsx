"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface FoodSearchResult {
  id: number;
  source_food_id: string;
  barcode_product_id?: number;
  source_method?: "manual" | "barcode";
  canonical_name: string;
  kcal_100g: number | null;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
  fiber_g_100g: number | null;
  default_portion_g: number | null;
  default_portion_name: string | null;
}

type AddItemFn = (
  food: FoodSearchResult,
  mealType: string,
  grams?: number
) => Promise<{ error: string | null }>;

interface SheetState {
  isOpen: boolean;
  mealId: string | null;
  addItemFn: AddItemFn | null;
}

interface SheetContextValue extends SheetState {
  openSheet: (mealId?: string, addItemFn?: AddItemFn) => void;
  closeSheet: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({
    isOpen: false,
    mealId: null,
    addItemFn: null,
  });

  const openSheet = (mealId?: string, addItemFn?: AddItemFn) =>
    setState({ isOpen: true, mealId: mealId ?? null, addItemFn: addItemFn ?? null });

  const closeSheet = () =>
    setState({ isOpen: false, mealId: null, addItemFn: null });

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
