import type { FoodSearchResult } from "@/context/SheetContext";

export type ScannerMode = "idle" | "camera" | "manual";
export type ScannerStatus = "idle" | "requesting" | "scanning" | "lookup" | "success" | "error";

/**
 * Un componente detectado por la foto, ya resuelto contra el catálogo (o creado
 * como alimento de IA), listo para revisar/editar antes de agregar al diario.
 * Compartido entre AddFoodSheet y PhotoReviewPanel.
 */
export type ReviewComponent = {
  food: FoodSearchResult;
  detectedName: string;
  matched: boolean;      // true si se linkeó a un alimento del catálogo
  isVerified: boolean;   // true si el alimento matcheado está verificado
  grams: string;         // gramos editables por el usuario
  included: boolean;     // si se agrega al diario
};
