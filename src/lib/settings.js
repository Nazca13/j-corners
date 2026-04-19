/**
 * Store Settings — shared via Supabase (not localStorage!)
 * 
 * REQUIRED: Run this SQL in Supabase SQL Editor:
 * 
 * CREATE TABLE IF NOT EXISTS store_settings (
 *   id integer PRIMARY KEY DEFAULT 1,
 *   address text DEFAULT '',
 *   phone text DEFAULT '6285137610502',
 *   qris_url text DEFAULT '',
 *   bank_accounts jsonb DEFAULT '[]'::jsonb,
 *   operating_hours text DEFAULT '08:00 - 22:00',
 *   alert_message text DEFAULT '',
 *   lat double precision DEFAULT -6.9733,
 *   lng double precision DEFAULT 107.6307,
 *   updated_at timestamptz DEFAULT now()
 * );
 * INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
 * ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Anyone can read settings" ON store_settings FOR SELECT USING (true);
 * CREATE POLICY "Auth can update settings" ON store_settings FOR UPDATE USING (auth.role() = 'authenticated');
 * CREATE POLICY "Auth can insert settings" ON store_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
 */

import { supabase } from './supabase'

const CACHE_KEY = 'jc_settings_cache'
const CACHE_TTL = 30000 // 30 seconds

const DEFAULTS = {
  address: 'Jl. Telekomunikasi No. 1, Sukapura, Dayeuhkolot, Bandung, Jawa Barat 40257',
  phone: '6285137610502',
  qris_url: '',
  bank_accounts: [],
  operating_hours: '08:00 - 22:00',
  alert_message: '',
  lat: -6.9733,
  lng: 107.6307,
}

export async function getStoreSettings() {
  // Check memory cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) return data
      }
    } catch (_e) {}
  }

  // Fetch from Supabase
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (data && !error) {
    // Ensure bank_accounts is array
    if (typeof data.bank_accounts === 'string') {
      try { data.bank_accounts = JSON.parse(data.bank_accounts) } catch (_e) { data.bank_accounts = [] }
    }
    // Cache locally
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch (_e) {}
    }
    return { ...DEFAULTS, ...data }
  }

  return DEFAULTS
}

export async function saveStoreSettings(settings) {
  const payload = {
    id: 1,
    address: settings.address || '',
    phone: settings.phone || '',
    qris_url: settings.qris_url || '',
    bank_accounts: settings.bank_accounts || [],
    operating_hours: settings.operating_hours || '08:00 - 22:00',
    alert_message: settings.alert_message || '',
    lat: settings.lat || DEFAULTS.lat,
    lng: settings.lng || DEFAULTS.lng,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('store_settings')
    .upsert(payload)

  if (!error && typeof window !== 'undefined') {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data: payload, ts: Date.now() })) } catch (_e) {}
  }
  return { error }
}

export { DEFAULTS as STORE_DEFAULTS }
