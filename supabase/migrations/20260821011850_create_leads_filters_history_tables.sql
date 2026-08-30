/*
# IndiaMART Lead Management CRM Schema

1. New Tables
- `leads`: Stores all incoming leads from IndiaMART webhook. Contains sender info, query details, matching status, and contact status.
- `filters`: Stores client-configured filter rules as JSONB. Each filter defines criteria for matching leads (product names, countries, required contact methods, excluded query types).
- `lead_history`: Audit trail of actions taken on each lead (contacted, skipped, notes, status changes).

2. Security
- Enable RLS on all tables.
- Single-tenant app (no auth screen) → policies use `TO anon, authenticated` so the anon-key frontend can operate.
- All CRUD allowed for anon + authenticated since this is a shared/internal CRM portal.

3. Indexes
- `leads.unique_query_id` — unique index for deduplication
- `leads.is_matched` — fast filtered queries for matched leads
- `leads.status` — fast status filtering
- `leads.created_at` — fast sorting and date-range queries
- `leads.sender_mobile` — fast search by mobile
- `leads.sender_email` — fast search by email
- `filters.is_active` — fast lookup of active filters
- `filters.client_id` — filter by client
- `lead_history.lead_id` — fast lookup of history for a lead

4. Realtime
- Enable realtime on `leads` table for live dashboard updates.
*/

-- ============================================
-- Table: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  unique_query_id VARCHAR(50) UNIQUE NOT NULL,
  query_type VARCHAR(10) NOT NULL,
  query_time TIMESTAMP NOT NULL,
  sender_name VARCHAR(255),
  sender_mobile VARCHAR(20),
  sender_mobile_alt VARCHAR(20),
  sender_phone VARCHAR(20),
  sender_phone_alt VARCHAR(20),
  sender_email VARCHAR(255),
  sender_email_alt VARCHAR(255),
  sender_company VARCHAR(255),
  sender_address TEXT,
  sender_city VARCHAR(100),
  sender_state VARCHAR(100),
  sender_pincode VARCHAR(10),
  sender_country_iso VARCHAR(5),
  subject TEXT,
  query_product_name VARCHAR(255),
  query_message TEXT,
  query_mcat_name VARCHAR(255),
  call_duration VARCHAR(50),
  receiver_mobile VARCHAR(20),
  is_matched BOOLEAN DEFAULT FALSE,
  is_contacted BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_unique_query_id ON leads (unique_query_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_matched ON leads (is_matched);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_sender_mobile ON leads (sender_mobile);
CREATE INDEX IF NOT EXISTS idx_leads_sender_email ON leads (sender_email);
CREATE INDEX IF NOT EXISTS idx_leads_query_product_name ON leads (query_product_name);

-- ============================================
-- Table: filters
-- ============================================
CREATE TABLE IF NOT EXISTS filters (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(100) NOT NULL DEFAULT 'default',
  filter_name VARCHAR(255) NOT NULL,
  filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filters_is_active ON filters (is_active);
CREATE INDEX IF NOT EXISTS idx_filters_client_id ON filters (client_id);

-- ============================================
-- Table: lead_history
-- ============================================
CREATE TABLE IF NOT EXISTS lead_history (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  action_details TEXT,
  contacted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_created_at ON lead_history (created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================

-- leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leads" ON leads;
CREATE POLICY "anon_delete_leads" ON leads FOR DELETE
  TO anon, authenticated USING (true);

-- filters
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_filters" ON filters;
CREATE POLICY "anon_select_filters" ON filters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_filters" ON filters;
CREATE POLICY "anon_insert_filters" ON filters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_filters" ON filters;
CREATE POLICY "anon_update_filters" ON filters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_filters" ON filters;
CREATE POLICY "anon_delete_filters" ON filters FOR DELETE
  TO anon, authenticated USING (true);

-- lead_history
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lead_history" ON lead_history;
CREATE POLICY "anon_select_lead_history" ON lead_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lead_history" ON lead_history;
CREATE POLICY "anon_insert_lead_history" ON lead_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lead_history" ON lead_history;
CREATE POLICY "anon_update_lead_history" ON lead_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lead_history" ON lead_history;
CREATE POLICY "anon_delete_lead_history" ON lead_history FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================
-- Realtime
-- ============================================
ALTER TABLE leads REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'filters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.filters;
  END IF;
END
$$;