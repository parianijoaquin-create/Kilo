import type { Instrumentation } from "next";

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max)
    : "";
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const normalized = error instanceof Error
    ? error
    : new Error(typeof error === "string" ? error : "Error desconocido");
  const digest = "digest" in normalized && typeof normalized.digest === "string"
    ? normalized.digest
    : "";
  const event = {
    source: "server",
    name: clean(normalized.name, 80) || "Error",
    message: clean(normalized.message, 300) || "Error desconocido",
    digest: clean(digest, 100) || undefined,
    method: clean(request.method, 12),
    path: clean(request.path, 200).split("?")[0],
    route: clean(context.routePath, 200),
    routeType: context.routeType,
    routerKind: context.routerKind,
  };

  console.error("[server-error]", JSON.stringify(event));
};
