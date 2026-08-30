import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { LeadHistory } from "@/types";

export function useLeadHistory(leadId: number | null) {
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!leadId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("lead_history")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setHistory((data ?? []) as LeadHistory[]);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addHistory = useCallback(
    async (action: string, actionDetails?: string) => {
      if (!leadId) return;
      const { data, error } = await supabase
        .from("lead_history")
        .insert({
          lead_id: leadId,
          action,
          action_details: actionDetails ?? null,
          contacted_at: action === "contacted" ? new Date().toISOString() : null,
        })
        .select("*")
        .single();
      if (error) throw error;
      await fetchHistory();
      return data as LeadHistory;
    },
    [leadId, fetchHistory]
  );

  return { history, loading, refetch: fetchHistory, addHistory };
}
