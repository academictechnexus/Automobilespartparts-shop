-- ═══════════════════════════════════════════════════════
-- AutoSpares Pro — Supabase SQL Schema
-- Run this in Supabase SQL Editor to create all tables
-- ═══════════════════════════════════════════════════════

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PARTS / INVENTORY ──────────────────────────────────
CREATE TABLE IF NOT EXISTS parts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  brand         TEXT,
  make          TEXT,          -- Vehicle make (Maruti, Hyundai)
  model         TEXT,          -- Vehicle model (Swift, i20)
  year_range    TEXT,          -- e.g. "2018-2023"
  category      TEXT NOT NULL DEFAULT 'Others',
  hsn_code      TEXT,
  gst_rate      INT NOT NULL DEFAULT 18,
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
  mrp            DECIMAL(10,2) DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  reorder_level  INT NOT NULL DEFAULT 5,
  location       TEXT,         -- Rack/Shelf location
  part_type      TEXT DEFAULT 'Aftermarket', -- OEM / Aftermarket
  unit           TEXT DEFAULT 'PCS',
  description    TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOMERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  phone         TEXT,
  alt_phone     TEXT,
  email         TEXT,
  address       TEXT,
  city          TEXT,
  pincode       TEXT,
  gst_no        TEXT,
  customer_type TEXT DEFAULT 'Retail', -- Retail / Wholesale
  credit_limit  DECIMAL(10,2) DEFAULT 0,
  balance       DECIMAL(10,2) DEFAULT 0,
  discount_pct  DECIMAL(5,2) DEFAULT 0,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUPPLIERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  contact_person TEXT,
  phone         TEXT,
  alt_phone     TEXT,
  email         TEXT,
  address       TEXT,
  city          TEXT,
  gst_no        TEXT,
  pan_no        TEXT,
  bank_name     TEXT,
  bank_account  TEXT,
  ifsc_code     TEXT,
  balance       DECIMAL(10,2) DEFAULT 0,  -- Amount payable
  notes         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVOICES (SALES) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_no    TEXT UNIQUE NOT NULL,
  invoice_type  TEXT DEFAULT 'Invoice', -- Invoice / Quotation / Credit Note
  invoice_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE,
  customer_id   UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,         -- Snapshot
  customer_gstin TEXT,
  billing_address TEXT,
  subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_pct  DECIMAL(5,2) DEFAULT 0,
  discount_amt  DECIMAL(10,2) DEFAULT 0,
  taxable_amt   DECIMAL(10,2) DEFAULT 0,
  cgst_amt      DECIMAL(10,2) DEFAULT 0,
  sgst_amt      DECIMAL(10,2) DEFAULT 0,
  igst_amt      DECIMAL(10,2) DEFAULT 0,
  total_gst     DECIMAL(10,2) DEFAULT 0,
  grand_total   DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount   DECIMAL(10,2) DEFAULT 0,
  balance_due   DECIMAL(10,2) DEFAULT 0,
  payment_mode  TEXT DEFAULT 'Cash',   -- Cash / UPI / Credit / Cheque / NEFT
  payment_ref   TEXT,
  status        TEXT DEFAULT 'paid',   -- paid / unpaid / partial / cancelled
  supply_type   TEXT DEFAULT 'intrastate', -- intrastate / interstate
  notes         TEXT,
  created_by    TEXT DEFAULT 'admin',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVOICE ITEMS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID REFERENCES invoices(id) ON DELETE CASCADE,
  part_id       UUID REFERENCES parts(id),
  part_code     TEXT,
  part_name     TEXT NOT NULL,
  hsn_code      TEXT,
  qty           DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit          TEXT DEFAULT 'PCS',
  rate          DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_pct  DECIMAL(5,2) DEFAULT 0,
  taxable_amt   DECIMAL(10,2) DEFAULT 0,
  gst_rate      INT DEFAULT 18,
  cgst_rate     DECIMAL(5,2) DEFAULT 9,
  sgst_rate     DECIMAL(5,2) DEFAULT 9,
  igst_rate     DECIMAL(5,2) DEFAULT 0,
  cgst_amt      DECIMAL(10,2) DEFAULT 0,
  sgst_amt      DECIMAL(10,2) DEFAULT 0,
  igst_amt      DECIMAL(10,2) DEFAULT 0,
  total_amt     DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- ─── PURCHASES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_no   TEXT UNIQUE NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id   UUID REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  supplier_invoice TEXT,
  subtotal      DECIMAL(10,2) DEFAULT 0,
  discount_amt  DECIMAL(10,2) DEFAULT 0,
  taxable_amt   DECIMAL(10,2) DEFAULT 0,
  cgst_amt      DECIMAL(10,2) DEFAULT 0,
  sgst_amt      DECIMAL(10,2) DEFAULT 0,
  igst_amt      DECIMAL(10,2) DEFAULT 0,
  total_gst     DECIMAL(10,2) DEFAULT 0,
  grand_total   DECIMAL(10,2) DEFAULT 0,
  paid_amount   DECIMAL(10,2) DEFAULT 0,
  balance_due   DECIMAL(10,2) DEFAULT 0,
  payment_mode  TEXT DEFAULT 'Credit',
  status        TEXT DEFAULT 'received', -- received / pending / partial
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PURCHASE ITEMS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id   UUID REFERENCES purchases(id) ON DELETE CASCADE,
  part_id       UUID REFERENCES parts(id),
  part_code     TEXT,
  part_name     TEXT NOT NULL,
  hsn_code      TEXT,
  qty           DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit          TEXT DEFAULT 'PCS',
  rate          DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst_rate      INT DEFAULT 18,
  cgst_amt      DECIMAL(10,2) DEFAULT 0,
  sgst_amt      DECIMAL(10,2) DEFAULT 0,
  total_amt     DECIMAL(10,2) DEFAULT 0
);

-- ─── JOB CARDS (MECHANIC ORDERS) ────────────────────────
CREATE TABLE IF NOT EXISTS job_cards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_no        TEXT UNIQUE NOT NULL,
  job_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id   UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  phone         TEXT,
  vehicle_no    TEXT,          -- e.g. TN 37 AB 1234
  vehicle_make  TEXT,
  vehicle_model TEXT,
  year          TEXT,
  km_in         INT,
  km_out        INT,
  complaints    TEXT,
  diagnosis     TEXT,
  work_done     TEXT,
  parts_used    JSONB,         -- Array of parts
  labour_charge DECIMAL(10,2) DEFAULT 0,
  parts_charge  DECIMAL(10,2) DEFAULT 0,
  total_charge  DECIMAL(10,2) DEFAULT 0,
  mechanic_name TEXT,
  status        TEXT DEFAULT 'open', -- open / in-progress / done / delivered
  invoice_id    UUID REFERENCES invoices(id),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXPENSES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  category      TEXT NOT NULL, -- Rent / Salary / Electricity / Transport
  description   TEXT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_mode  TEXT DEFAULT 'Cash',
  receipt_no    TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS (RECEIPTS & PAYMENTS) ─────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  type          TEXT NOT NULL, -- receipt / payment
  party_type    TEXT,          -- customer / supplier
  party_id      UUID,
  party_name    TEXT,
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_mode  TEXT DEFAULT 'Cash',
  reference_no  TEXT,
  invoice_id    UUID,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STOCK MOVEMENTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_id       UUID REFERENCES parts(id),
  movement_type TEXT NOT NULL,  -- sale / purchase / return / adjustment
  reference_id  UUID,
  reference_no  TEXT,
  qty_in        DECIMAL(10,2) DEFAULT 0,
  qty_out       DECIMAL(10,2) DEFAULT 0,
  balance_qty   DECIMAL(10,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHOP SETTINGS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key           TEXT UNIQUE NOT NULL,
  value         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('shop_name', 'AutoSpares Shop'),
  ('shop_address', '123 Main Road'),
  ('shop_phone', '9876543210'),
  ('shop_email', ''),
  ('shop_gstin', ''),
  ('shop_pan', ''),
  ('bank_name', ''),
  ('bank_account', ''),
  ('bank_ifsc', ''),
  ('invoice_prefix', 'INV'),
  ('purchase_prefix', 'PUR'),
  ('financial_year', '2024-25'),
  ('invoice_counter', '1'),
  ('purchase_counter', '1'),
  ('job_counter', '1'),
  ('default_gst_type', 'intrastate'),
  ('state', 'Tamil Nadu'),
  ('state_code', '33'),
  ('language', 'en'),
  ('whatsapp_enabled', 'false'),
  ('sms_enabled', 'false'),
  ('low_stock_alert', 'true'),
  ('tally_export', 'false')
ON CONFLICT (key) DO NOTHING;

-- ─── FUNCTION: Update Stock ──────────────────────────────
CREATE OR REPLACE FUNCTION update_stock(part_id UUID, qty_change DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE parts SET stock = stock + qty_change, updated_at = NOW()
  WHERE id = part_id;
END;
$$ LANGUAGE plpgsql;

-- ─── TRIGGER: Updated_at auto-update ────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER job_cards_updated_at BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users (customize later for multi-user)
CREATE POLICY "Allow all for authenticated" ON parts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON purchase_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON job_cards FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON settings FOR ALL TO authenticated USING (true);
