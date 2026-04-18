-- ============================================================
-- J-CORNERS UPGRADE — REVIEWS, PROMO CODES, REALTIME
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON reviews;

CREATE POLICY "Allow public insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read reviews"
  ON reviews FOR SELECT
  USING (true);

-- 2. PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  min_order INTEGER DEFAULT 0,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Allow authenticated write promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Allow authenticated update promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Allow authenticated delete promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Allow public update promo usage" ON promo_codes;

CREATE POLICY "Allow public read promo_codes"
  ON promo_codes FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated write promo_codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update promo_codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete promo_codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (true);

-- Allow anon to increment usage_count
CREATE POLICY "Allow public update promo usage"
  ON promo_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. ENABLE REALTIME on orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 4. Add nama_pelanggan to orders if missing (for reviews display)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS nama_pelanggan TEXT;

-- DONE
SELECT 'Migration complete!' AS status;
