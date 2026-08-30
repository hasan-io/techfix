import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Filter } from "@/types";

export function useFilters() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("filters")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setFilters((data ?? []) as Filter[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const saveFilter = useCallback(
    async (filter: Partial<Filter> & { filter_name: string; filter_config: unknown }) => {
      const payload = {
        client_id: filter.client_id ?? "default",
        filter_name: filter.filter_name,
        filter_config: filter.filter_config,
        is_active: filter.is_active ?? true,
      };
      const { data, error: err } = await supabase
        .from("filters")
        .insert(payload)
        .select("*")
        .single();
      if (err) throw err;
      await fetchFilters();
      return data as Filter;
    },
    [fetchFilters]
  );

  const updateFilter = useCallback(
    async (id: number, updates: Partial<Filter>) => {
      const { data, error: err } = await supabase
        .from("filters")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (err) throw err;
      await fetchFilters();
      return data as Filter;
    },
    [fetchFilters]
  );

  const deleteFilter = useCallback(
    async (id: number) => {
      const { error: err } = await supabase.from("filters").delete().eq("id", id);
      if (err) throw err;
      await fetchFilters();
    },
    [fetchFilters]
  );

  return { filters, loading, error, refetch: fetchFilters, saveFilter, updateFilter, deleteFilter };
}
