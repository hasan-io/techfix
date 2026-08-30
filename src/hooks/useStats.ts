import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DashboardStats } from "@/types";

export function useStats() {
  const [stats, setStats] = useState<DashboardStats>({
    total_leads: 0,
    matched_leads: 0,
    contacted_leads: 0,
    failed_leads: 0,
    today_leads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

      const [totalRes, matchedRes, contactedRes, failedRes, todayRes] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("is_matched", true),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "contacted"),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", startOfDay),
      ]);

      setStats({
        total_leads: totalRes.count ?? 0,
        matched_leads: matchedRes.count ?? 0,
        contacted_leads: contactedRes.count ?? 0,
        failed_leads: failedRes.count ?? 0,
        today_leads: todayRes.count ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
