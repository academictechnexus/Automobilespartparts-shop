-- ═══════════════════════════════════════════════════════════════════════════
-- AutoSpares Pro — Complete Multi-Tenant Supabase Schema
-- Version 4.0 — Production Ready
-- Run this in Supabase SQL Editor (wipe existing tables first if upgrading)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TENANTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name       TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  gstin           TEXT,
  pan             TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT DEFAULT 'Tamil Nadu',
  state_code      TEXT DEFAULT '33',
  plan            TEXT DEFAULT 'trial',        -- trial/basic/standard/pro
  trial_start     TIMESTAMPTZ DEFAULT NOW(),
  trial_end       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  subscription_end TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  invoice_prefix  TEXT DEFAULT 'INV',
  purchase_prefix TEXT DEFAULT 'PUR',
  job_prefix      TEXT DEFAULT 'JOB',
  invoice_counter INT DEFAULT 1,
  purchase_counter INT DEFAULT 1,
  job_counter     INT DEFAULT 1,
  bank_name       TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  upi_id          TEXT,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BRANCHES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  is_main     BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES branches(id),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'salesman',
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ─── PARTS / INVENTORY ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  brand           TEXT,
  make            TEXT,
  model           TEXT,
  year_range      TEXT,
  category        TEXT DEFAULT 'Others',
  hsn_code        TEXT,
  gst_rate        INT DEFAULT 18,
  purchase_price  DECIMAL(10,2) DEFAULT 0,
  selling_price   DECIMAL(10,2) DEFAULT 0,
  mrp             DECIMAL(10,2) DEFAULT 0,
  stock           DECIMAL(10,2) DEFAULT 0,
  reorder_level   DECIMAL(10,2) DEFAULT 5,
  location        TEXT,
  part_type       TEXT DEFAULT 'Aftermarket',
  unit            TEXT DEFAULT 'PCS',
  barcode         TEXT,
  warranty_months INT DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  last_sold_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  alt_phone       TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  pincode         TEXT,
  gst_no          TEXT,
  customer_type   TEXT DEFAULT 'Retail',
  credit_limit    DECIMAL(10,2) DEFAULT 0,
  balance         DECIMAL(10,2) DEFAULT 0,
  discount_pct    DECIMAL(5,2) DEFAULT 0,
  credit_score    INT DEFAULT 100,            -- 0-100 risk score
  vehicle_nos     TEXT[],                     -- array of vehicle numbers
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  alt_phone       TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  gst_no          TEXT,
  pan_no          TEXT,
  bank_name       TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  balance         DECIMAL(10,2) DEFAULT 0,
  avg_delivery_days INT DEFAULT 3,
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  invoice_no      TEXT NOT NULL,
  invoice_type    TEXT DEFAULT 'Invoice',
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  customer_id     UUID REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  customer_gstin  TEXT,
  billing_address TEXT,
  subtotal        DECIMAL(10,2) DEFAULT 0,
  discount_pct    DECIMAL(5,2) DEFAULT 0,
  discount_amt    DECIMAL(10,2) DEFAULT 0,
  taxable_amt     DECIMAL(10,2) DEFAULT 0,
  cgst_amt        DECIMAL(10,2) DEFAULT 0,
  sgst_amt        DECIMAL(10,2) DEFAULT 0,
  igst_amt        DECIMAL(10,2) DEFAULT 0,
  total_gst       DECIMAL(10,2) DEFAULT 0,
  grand_total     DECIMAL(10,2) DEFAULT 0,
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  balance_due     DECIMAL(10,2) DEFAULT 0,
  payment_mode    TEXT DEFAULT 'Cash',
  payment_ref     TEXT,
  status          TEXT DEFAULT 'paid',
  supply_type     TEXT DEFAULT 'intrastate',
  is_cancelled    BOOLEAN DEFAULT FALSE,
  cancel_reason   TEXT,
  original_inv_id UUID,                       -- for credit notes
  notes           TEXT,
  created_by      TEXT DEFAULT 'admin',
  revision        INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_no)
);

-- ─── INVOICE ITEMS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  part_id       UUID REFERENCES parts(id),
  part_code     TEXT,
  part_name     TEXT NOT NULL,
  hsn_code      TEXT,
  qty           DECIMAL(10,2) DEFAULT 1,
  unit          TEXT DEFAULT 'PCS',
  rate          DECIMAL(10,2) DEFAULT 0,
  discount_pct  DECIMAL(5,2) DEFAULT 0,
  taxable_amt   DECIMAL(10,2) DEFAULT 0,
  gst_rate      INT DEFAULT 18,
  cgst_amt      DECIMAL(10,2) DEFAULT 0,
  sgst_amt      DECIMAL(10,2) DEFAULT 0,
  igst_amt      DECIMAL(10,2) DEFAULT 0,
  total_amt     DECIMAL(10,2) DEFAULT 0
);

-- ─── PURCHASES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  purchase_no     TEXT NOT NULL,
  purchase_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id     UUID REFERENCES suppliers(id),
  supplier_name   TEXT NOT NULL,
  supplier_invoice TEXT,
  subtotal        DECIMAL(10,2) DEFAULT 0,
  discount_amt    DECIMAL(10,2) DEFAULT 0,
  taxable_amt     DECIMAL(10,2) DEFAULT 0,
  cgst_amt        DECIMAL(10,2) DEFAULT 0,
  sgst_amt        DECIMAL(10,2) DEFAULT 0,
  igst_amt        DECIMAL(10,2) DEFAULT 0,
  total_gst       DECIMAL(10,2) DEFAULT 0,
  grand_total     DECIMAL(10,2) DEFAULT 0,
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  balance_due     DECIMAL(10,2) DEFAULT 0,
  payment_mode    TEXT DEFAULT 'Credit',
  status          TEXT DEFAULT 'received',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, purchase_no)
);

-- ─── PURCHASE ITEMS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL,
  part_id     UUID REFERENCES parts(id),
  part_code   TEXT,
  part_name   TEXT NOT NULL,
  hsn_code    TEXT,
  qty         DECIMAL(10,2) DEFAULT 1,
  unit        TEXT DEFAULT 'PCS',
  rate        DECIMAL(10,2) DEFAULT 0,
  gst_rate    INT DEFAULT 18,
  cgst_amt    DECIMAL(10,2) DEFAULT 0,
  sgst_amt    DECIMAL(10,2) DEFAULT 0,
  total_amt   DECIMAL(10,2) DEFAULT 0
);

-- ─── RETURNS (Sales & Purchase) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  return_no       TEXT NOT NULL,
  return_type     TEXT NOT NULL,  -- 'sales_return' / 'purchase_return'
  return_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  ref_invoice_id  UUID,           -- original invoice/purchase
  ref_invoice_no  TEXT,
  party_id        UUID,           -- customer_id or supplier_id
  party_name      TEXT NOT NULL,
  subtotal        DECIMAL(10,2) DEFAULT 0,
  taxable_amt     DECIMAL(10,2) DEFAULT 0,
  cgst_amt        DECIMAL(10,2) DEFAULT 0,
  sgst_amt        DECIMAL(10,2) DEFAULT 0,
  igst_amt        DECIMAL(10,2) DEFAULT 0,
  total_gst       DECIMAL(10,2) DEFAULT 0,
  grand_total     DECIMAL(10,2) DEFAULT 0,
  reason          TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'processed',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id   UUID REFERENCES returns(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL,
  part_id     UUID REFERENCES parts(id),
  part_name   TEXT NOT NULL,
  qty         DECIMAL(10,2) DEFAULT 1,
  rate        DECIMAL(10,2) DEFAULT 0,
  gst_rate    INT DEFAULT 18,
  total_amt   DECIMAL(10,2) DEFAULT 0
);

-- ─── JOB CARDS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_no          TEXT NOT NULL,
  job_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id     UUID REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  phone           TEXT,
  vehicle_no      TEXT,
  vehicle_make    TEXT,
  vehicle_model   TEXT,
  year            TEXT,
  km_in           INT,
  km_out          INT,
  complaints      TEXT,
  diagnosis       TEXT,
  work_done       TEXT,
  parts_used      JSONB,
  labour_charge   DECIMAL(10,2) DEFAULT 0,
  parts_charge    DECIMAL(10,2) DEFAULT 0,
  total_charge    DECIMAL(10,2) DEFAULT 0,
  mechanic_name   TEXT,
  status          TEXT DEFAULT 'open',
  invoice_id      UUID REFERENCES invoices(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  amount        DECIMAL(10,2) DEFAULT 0,
  payment_mode  TEXT DEFAULT 'Cash',
  receipt_no    TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STOCK MOVEMENTS (full audit trail) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  part_id         UUID REFERENCES parts(id),
  movement_type   TEXT NOT NULL,  -- sale/purchase/return/adjustment/transfer
  reference_id    UUID,
  reference_no    TEXT,
  qty_in          DECIMAL(10,2) DEFAULT 0,
  qty_out         DECIMAL(10,2) DEFAULT 0,
  balance_qty     DECIMAL(10,2) DEFAULT 0,
  unit_cost       DECIMAL(10,2) DEFAULT 0,
  reason          TEXT,
  user_name       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID,
  user_name   TEXT,
  action      TEXT NOT NULL,   -- CREATE/UPDATE/DELETE/LOGIN/LOGOUT
  table_name  TEXT,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  type          TEXT NOT NULL,  -- receipt/payment
  party_type    TEXT,
  party_id      UUID,
  party_name    TEXT,
  amount        DECIMAL(10,2) DEFAULT 0,
  payment_mode  TEXT DEFAULT 'Cash',
  reference_no  TEXT,
  invoice_id    UUID,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UPDATE TRIGGERS ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────
-- Enable RLS on every table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own tenant's data
-- The app sets the tenant_id via a custom JWT claim or session variable

-- Helper function to get current tenant from JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('app.tenant_id', TRUE))::UUID,
    NULL
  );
$$ LANGUAGE sql STABLE;

-- Apply tenant isolation policies to all tables
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'branches','users','parts','customers','suppliers',
    'invoices','invoice_items','purchases','purchase_items',
    'returns','return_items','job_cards','expenses',
    'stock_movements','audit_logs','payments'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "tenant_isolation" ON %I FOR ALL TO authenticated USING (tenant_id = current_tenant_id())',
      tbl
    );
  END LOOP;
END $$;

-- Tenants can only see their own row
CREATE POLICY "own_tenant" ON tenants FOR ALL TO authenticated USING (id = current_tenant_id());

