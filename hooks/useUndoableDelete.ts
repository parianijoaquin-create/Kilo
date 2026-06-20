"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";

interface Options {
  /** Toast message, e.g. "Hábito eliminado". */
  label?: string;
  /** Grace period before the real delete fires. */
  delay?: number;
}

/**
 * Optimistic, undoable delete. While the toast is visible the row is hidden
 * but NOT yet removed from the database; "Deshacer" cancels it, otherwise the
 * real `commit` runs once the grace period elapses.
 */
export function useUndoableDelete(
  commit: (id: string) => void | Promise<unknown>,
  opts: Options = {}
) {
  const { showToast } = useToast();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const drop = useCallback((id: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const remove = useCallback(
    (id: string) => {
      const delay = opts.delay ?? 4000;
      setPending((prev) => new Set(prev).add(id));

      const timer = setTimeout(async () => {
        await commit(id);
        timers.current.delete(id);
        drop(id);
      }, delay);
      timers.current.set(id, timer);

      showToast({
        message: opts.label ?? "Eliminado",
        actionLabel: "Deshacer",
        duration: delay,
        onAction: () => {
          clearTimeout(timer);
          timers.current.delete(id);
          drop(id);
        },
      });
    },
    [commit, drop, opts.delay, opts.label, showToast]
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  const isPending = useCallback((id: string) => pending.has(id), [pending]);

  return { remove, isPending };
}
