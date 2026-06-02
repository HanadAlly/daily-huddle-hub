type alyErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type alyEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: alyErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __alyEvents?: alyEvents;
  }
}

export function reportalyError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__alyEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
