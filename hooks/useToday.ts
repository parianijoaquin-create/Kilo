"use client";

import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function msUntilNextMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 50);
  return next.getTime() - now.getTime();
}

/** Returns today's date as YYYY-MM-DD and re-renders automatically at local midnight. */
export function useToday() {
  const [date, setDate] = useState(todayStr);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      timer = setTimeout(() => {
        setDate(todayStr());
        schedule();
      }, msUntilNextMidnight());
    }
    schedule();

    const onVisible = () => {
      if (document.visibilityState === "visible") setDate(todayStr());
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return date;
}
