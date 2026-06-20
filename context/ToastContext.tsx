"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);
  const seq = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setToast(null), 240);
  }, []);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const duration = opts.duration ?? 4000;
      const id = ++seq.current;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      setToast({ ...opts, id });
      // next frame -> slide in
      requestAnimationFrame(() => setVisible(true));
      hideTimer.current = setTimeout(dismiss, duration);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "50%",
            bottom: "calc(86px + env(safe-area-inset-bottom, 0px))",
            transform: `translateX(-50%) translateY(${visible ? 0 : 24}px)`,
            opacity: visible ? 1 : 0,
            transition: "transform 240ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 14,
            maxWidth: "min(440px, calc(100vw - 32px))",
            width: "max-content",
            padding: "12px 14px 12px 18px",
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 14,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--text-1)",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
            }}
          >
            {toast.message}
          </span>
          {toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                dismiss();
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--lime)",
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                cursor: "pointer",
                padding: "4px 6px",
                whiteSpace: "nowrap",
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
