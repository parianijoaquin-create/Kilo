"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrorReporting";

export function ClientErrorMonitor() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError(event.error ?? event.message, "window.error");
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, "unhandledrejection");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
