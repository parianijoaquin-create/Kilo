"use client";

type ClientErrorSource = "window.error" | "unhandledrejection" | "global-error";

const MAX_REPORTS_PER_PAGE = 5;
let reportsSent = 0;
const fingerprints = new Set<string>();

function clean(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value : fallback;
  return text.replace(/[\r\n\t]+/g, " ").trim().slice(0, 300);
}

export function reportClientError(reason: unknown, source: ClientErrorSource, digest?: string) {
  if (reportsSent >= MAX_REPORTS_PER_PAGE || typeof window === "undefined") return;

  const error = reason instanceof Error ? reason : null;
  const payload = {
    name: clean(error?.name, "Error"),
    message: clean(error?.message ?? reason, "Error desconocido"),
    digest: clean(digest, ""),
    path: window.location.pathname.slice(0, 200),
    source,
  };
  const fingerprint = `${payload.source}:${payload.name}:${payload.message}:${payload.path}`;
  if (fingerprints.has(fingerprint)) return;

  fingerprints.add(fingerprint);
  reportsSent += 1;
  void fetch("/api/monitoring/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
