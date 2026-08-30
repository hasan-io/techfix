import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FilterConfig {
  product_names: string[];
  countries: string[];
  require_mobile: boolean;
  require_email: boolean;
  require_whatsapp: boolean;
  exclude_query_types: string[];
}

interface ActiveFilter {
  id: number;
  filter_config: FilterConfig;
}

function leadMatchesFilter(lead: Record<string, unknown>, config: FilterConfig): boolean {
  const queryType = String(lead.query_type ?? "").toUpperCase();
  const productName = String(lead.query_product_name ?? "").toLowerCase();
  const countryIso = String(lead.sender_country_iso ?? "").toUpperCase();
  const hasMobile = Boolean(lead.sender_mobile);
  const hasEmail = Boolean(lead.sender_email);

  if (config.exclude_query_types?.length > 0) {
    if (config.exclude_query_types.map((t) => t.toUpperCase()).includes(queryType)) {
      return false;
    }
  }

  if (config.product_names?.length > 0) {
    const matched = config.product_names.some((p) =>
      productName.includes(p.toLowerCase())
    );
    if (!matched) return false;
  }

  if (config.countries?.length > 0) {
    if (!config.countries.map((c) => c.toUpperCase()).includes(countryIso)) {
      return false;
    }
  }

  if (config.require_mobile && !hasMobile) return false;
  if (config.require_email && !hasEmail) return false;
  if (config.require_whatsapp && queryType !== "WA") return false;

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active filters
    const { data: activeFilters, error: filterError } = await supabase
      .from("filters")
      .select("id, filter_config")
      .eq("is_active", true);

    if (filterError) {
      return new Response(
        JSON.stringify({ status: "error", message: filterError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!activeFilters || activeFilters.length === 0) {
      // No active filters → mark all as unmatched
      const { data: resetData } = await supabase
        .from("leads")
        .update({ is_matched: false, updated_at: new Date().toISOString() })
        .eq("is_matched", true)
        .select("id");

      return new Response(
        JSON.stringify({ status: "success", reprocessed_count: 0, reset_count: resetData?.length ?? 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filters = activeFilters as ActiveFilter[];

    // Fetch all leads in batches
    let reprocessedCount = 0;
    let batch = 0;
    const batchSize = 500;
    let hasMore = true;

    while (hasMore) {
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .range(batch * batchSize, (batch + 1) * batchSize - 1)
        .order("id", { ascending: true });

      if (leadsError) {
        return new Response(
          JSON.stringify({ status: "error", message: leadsError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!leads || leads.length === 0) {
        hasMore = false;
        break;
      }

      // Build update operations
      const toMatch: number[] = [];
      const toUnmatch: number[] = [];

      for (const lead of leads) {
        const matched = filters.some((f) =>
          leadMatchesFilter(lead as Record<string, unknown>, f.filter_config as FilterConfig)
        );

        if (matched && !lead.is_matched) {
          toMatch.push(lead.id);
        } else if (!matched && lead.is_matched) {
          toUnmatch.push(lead.id);
        }
      }

      if (toMatch.length > 0) {
        await supabase
          .from("leads")
          .update({ is_matched: true, updated_at: new Date().toISOString() })
          .in("id", toMatch);
        reprocessedCount += toMatch.length;
      }

      if (toUnmatch.length > 0) {
        await supabase
          .from("leads")
          .update({ is_matched: false, updated_at: new Date().toISOString() })
          .in("id", toUnmatch);
      }

      if (leads.length < batchSize) {
        hasMore = false;
      }
      batch++;
    }

    return new Response(
      JSON.stringify({ status: "success", reprocessed_count: reprocessedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
