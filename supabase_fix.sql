-- ============================================================
-- J-CORNERS SUPABASE FIX SCRIPT
-- Jalankan ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tambah kolom 'available' ke tabel products jika belum ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- 2. Pastikan kolom category ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Food';

-- 3. Pastikan kolom image_url ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================
-- RLS POLICIES untuk tabel PRODUCTS
-- ============================================================

-- Aktifkan RLS (jika belum)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (biar clean)
DROP POLICY IF EXISTS "Products bisa dibaca siapa saja" ON products;
DROP POLICY IF EXISTS "Hanya admin yg bisa insert" ON products;
DROP POLICY IF EXISTS "Hanya admin yg bisa update" ON products;
DROP POLICY IF EXISTS "Hanya admin yg bisa delete" ON products;
DROP POLICY IF EXISTS "Allow public read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;

-- READ: Semua orang (anon + authenticated) bisa baca products
CREATE POLICY "Allow public read products"
  ON products FOR SELECT
  USING (true);

-- INSERT: Hanya authenticated user (admin yang sudah login)
CREATE POLICY "Allow authenticated insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Hanya authenticated user
CREATE POLICY "Allow authenticated update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Hanya authenticated user
CREATE POLICY "Allow authenticated delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- RLS POLICIES untuk tabel ORDERS
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama
DROP POLICY IF EXISTS "Allow public read orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read all orders" ON orders;

-- READ orders: anon bisa baca (untuk halaman history user)
CREATE POLICY "Allow public read orders"
  ON orders FOR SELECT
  USING (true);

-- INSERT orders: semua orang bisa buat pesanan (termasuk user yg tidak login)
CREATE POLICY "Allow public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- UPDATE orders: hanya authenticated (admin update status)
CREATE POLICY "Allow authenticated update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Storage bucket policies (jika menggunakan upload gambar)
-- ============================================================

-- Pastikan bucket 'product-images' ada dan PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Pastikan bucket 'bukti-transfer' ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('bukti-transfer', 'bukti-transfer', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy storage: semua bisa upload ke product-images
DROP POLICY IF EXISTS "Allow authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload bukti" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read bukti" ON storage.objects;

CREATE POLICY "Allow authenticated upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow public upload bukti"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bukti-transfer');

CREATE POLICY "Allow public read bukti"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bukti-transfer');

-- ============================================================
-- VERIFIKASI: Cek kolom products
-- ============================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
