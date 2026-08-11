import { useCallback, useEffect, useState } from "react";

export type ConsentValue = "accepted" | "declined" | null;

export const useConsent = (key: string) => {
  const storageKey = `consent:${key}`;
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as ConsentValue;
      setConsent(stored === "accepted" || stored === "declined" ? stored : null);
    } catch {
      setConsent(null);
    }
    setReady(true);
  }, [storageKey]);

  const set = useCallback(
    (value: Exclude<ConsentValue, null>) => {
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        /* ignore */
      }
      setConsent(value);
    },
    [storageKey]
  );

  return {
    consent,
    ready,
    accept: () => set("accepted"),
    decline: () => set("declined"),
  };
};

export default useConsent;