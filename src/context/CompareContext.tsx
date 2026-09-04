import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { products } from "@/data/products";
import type { Product } from "@/data/products";

const STORAGE_KEY = "achuqe_compare_v1";
const MAX_COMPARE = 3;

interface CompareContextType {
  items: Product[];
  ids: string[];
  toggleCompare: (product: Product) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]).filter((id) => products.some((p) => p.id === id)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch { /* ignore */ }
  }, [ids]);

  const isInCompare = useCallback((id: string) => ids.includes(id), [ids]);
  const isFull = ids.length >= MAX_COMPARE;

  const toggleCompare = useCallback((product: Product) => {
    setIds((prev) => {
      if (prev.includes(product.id)) return prev.filter((i) => i !== product.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, product.id];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const clearCompare = useCallback(() => setIds([]), []);

  const items = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  return (
    <CompareContext.Provider value={{ items, ids, toggleCompare, removeFromCompare, clearCompare, isInCompare, isFull }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
