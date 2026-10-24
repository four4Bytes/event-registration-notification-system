"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getUnreadNotificationCountAction } from "./actions";

interface UnreadCountContextValue {
  count: number;
  setCount: (value: number) => void;
  decrement: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextValue | null>(null);

interface UnreadCountProviderProps {
  initialCount: number;
  children: ReactNode;
}

export function UnreadCountProvider({ initialCount, children }: UnreadCountProviderProps) {
  const [count, setCount] = useState(initialCount);
  const seqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const seq = ++seqRef.current;
      try {
        const newCount = await getUnreadNotificationCountAction();
        if (!cancelled && seq === seqRef.current) setCount(newCount);
      } catch {
        // Swallow server-action errors during silent polling
      }
    }

    const intervalId = setInterval(() => void poll(), 30_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void poll();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    function handleFocus() {
      void poll();
    }
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const value = useMemo<UnreadCountContextValue>(
    () => ({
      count,
      setCount: (next) => {
        seqRef.current += 1;
        setCount(next);
      },
      decrement: () => {
        seqRef.current += 1;
        setCount((prev) => Math.max(0, prev - 1));
      },
    }),
    [count],
  );

  return <UnreadCountContext.Provider value={value}>{children}</UnreadCountContext.Provider>;
}

export function useUnreadCount(): UnreadCountContextValue {
  const context = useContext(UnreadCountContext);
  if (!context) throw new Error("useUnreadCount must be used within an UnreadCountProvider");
  return context;
}
