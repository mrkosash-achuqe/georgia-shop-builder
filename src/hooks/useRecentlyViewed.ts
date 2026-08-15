import { useCallback, useEffect, useState } from "react";

const KEY = "achuqe_recently_viewed";
const MAX = 12;

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
};

export const pushRecentlyViewed = (id: string) => {
  if (!id) return;
  const next = [id, ...read().filter((v) => v !== id)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("achuqe:recently-viewed"));
};

export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener("achuqe:recently-viewed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("achuqe:recently-viewed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("achuqe:recently-viewed"));
  }, []);

  return { ids, clear };
};
