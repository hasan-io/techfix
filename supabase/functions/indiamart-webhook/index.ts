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

    const body = await req.json();
    const response = body?.RESPONSE ?? body?.response ?? body;

    if (!response || !response.UNIQUE_QUERY_ID) {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing UNIQUE_QUERY_ID in payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uniqueQueryId = String(response.UNIQUE_QUERY_ID);

    // Deduplication check
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("unique_query_id", uniqueQueryId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "success", message: "Duplicate lead, already exists", unique_query_id: uniqueQueryId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse query_time: "2024-04-10 11:17:14" → ISO
    const rawQueryTime = String(response.QUERY_TIME ?? "");
    const queryTime = rawQueryTime ? rawQueryTime.replace(" ", "T") + "+05:30" : new Date().toISOString();

    const leadRecord = {
      unique_query_id: uniqueQueryId,
      query_type: String(response.QUERY_TYPE ?? ""),
      query_time: queryTime,
      sender_name: response.SENDER_NAME ?? null,
      sender_mobile: response.SENDER_MOBILE ?? null,
      sender_mobile_alt: response.SENDER_MOBILE_ALT ?? null,
      sender_phone: response.SENDER_PHONE ?? null,
      sender_phone_alt: response.SENDER_PHONE_ALT ?? null,
      sender_email: response.SENDER_EMAIL ?? null,
      sender_email_alt: response.SENDER_EMAIL_ALT ?? null,
      sender_company: response.SENDER_COMPANY ?? null,
      sender_address: response.SENDER_ADDRESS ?? null,
      sender_city: response.SENDER_CITY ?? null,
      sender_state: response.SENDER_STATE ?? null,
      sender_pincode: response.SENDER_PINCODE ?? null,
      sender_country_iso: response.SENDER_COUNTRY_ISO ?? null,
      subject: response.SUBJECT ?? null,
      query_product_name: response.QUERY_PRODUCT_NAME ?? null,
      query_message: response.QUERY_MESSAGE ?? null,
      query_mcat_name: response.QUERY_MCAT_NAME ?? null,
      call_duration: response.CALL_DURATION ?? null,
      receiver_mobile: response.RECEIVER_MOBILE ?? null,
    };

    // Fetch active filters
    const { data: activeFilters } = await supabase
      .from("filters")
      .select("id, filter_config")
      .eq("is_active", true);

    let isMatched = false;
    if (activeFilters && activeFilters.length > 0) {
      isMatched = (activeFilters as ActiveFilter[]).some((f) =>
        leadMatchesFilter(leadRecord, f.filter_config as FilterConfig)
      );
    }

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert({ ...leadRecord, is_matched: isMatched })
      .select("id")
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ status: "error", message: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Lead received",
        unique_query_id: uniqueQueryId,
        is_matched: isMatched,
        lead_id: insertedLead?.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
