import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const POINTS_PER_GEL = 100; // 100 points = 1 GEL

export type LoyaltyTx = {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
};

export const useLoyalty = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<LoyaltyTx[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setHistory([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("loyalty_transactions")
      .select("id, points, type, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const list = (data as LoyaltyTx[]) ?? [];
    setHistory(list);
    setBalance(Math.max(0, list.reduce((sum, tx) => sum + tx.points, 0)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, history, loading, refresh, pointsToGel: (p: number) => p / POINTS_PER_GEL };
};