import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/types";

interface UseLeadsOptions {
  matchedOnly?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  statusFilter?: string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

export function useLeads(options: UseLeadsOptions = {}) {
  const {
    matchedOnly = false,
    page = 1,
    limit = 20,
    search = "",
    statusFilter = "",
    sortColumn = "created_at",
    sortDirection = "desc",
  } = options;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from("leads").select("*", { count: "exact" });

    if (matchedOnly) {
      query = query.eq("is_matched", true);
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `sender_name.ilike.%${s}%,sender_mobile.ilike.%${s}%,sender_email.ilike.%${s}%,query_product_name.ilike.%${s}%,sender_company.ilike.%${s}%`
      );
    }

    query = query.order(sortColumn, { ascending: sortDirection === "asc" });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error: err, count } = await query;

    if (err) {
      setError(err.message);
    } else {
      setLeads((data ?? []) as Lead[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [matchedOnly, page, limit, search, statusFilter, sortColumn, sortDirection]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, total, loading, error, refetch: fetchLeads };
}
