export interface Lead {
  id: number;
  unique_query_id: string;
  query_type: string;
  query_time: string;
  sender_name: string | null;
  sender_mobile: string | null;
  sender_mobile_alt: string | null;
  sender_phone: string | null;
  sender_phone_alt: string | null;
  sender_email: string | null;
  sender_email_alt: string | null;
  sender_company: string | null;
  sender_address: string | null;
  sender_city: string | null;
  sender_state: string | null;
  sender_pincode: string | null;
  sender_country_iso: string | null;
  subject: string | null;
  query_product_name: string | null;
  query_message: string | null;
  query_mcat_name: string | null;
  call_duration: string | null;
  receiver_mobile: string | null;
  is_matched: boolean;
  is_contacted: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FilterConfig {
  product_names: string[];
  countries: string[];
  require_mobile: boolean;
  require_email: boolean;
  require_whatsapp: boolean;
  exclude_query_types: string[];
}

export interface Filter {
  id: number;
  client_id: string;
  filter_name: string;
  filter_config: FilterConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadHistory {
  id: number;
  lead_id: number;
  action: string;
  action_details: string | null;
  contacted_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_leads: number;
  matched_leads: number;
  contacted_leads: number;
  failed_leads: number;
  today_leads: number;
}

export const LEAD_STATUSES = ["new", "contacted", "skipped", "failed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const QUERY_TYPES = ["B", "W", "WA", "P", "BIZ"] as const;

export const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "bg-blue-100", text: "text-blue-700", label: "New" },
  contacted: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Contacted" },
  skipped: { bg: "bg-amber-100", text: "text-amber-700", label: "Skipped" },
  failed: { bg: "bg-red-100", text: "text-red-700", label: "Failed" },
};

export const QUERY_TYPE_LABELS: Record<string, string> = {
  B: "Buy Lead",
  W: "WhatsApp",
  WA: "WhatsApp Alert",
  P: "Phone Call",
  BIZ: "Business Inquiry",
};
