'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Clock, ShoppingBag, Store, Coffee, Cake, UtensilsCrossed, Sparkles,
  MapPin, Navigation2, Phone, Star, Heart, Truck, CheckCircle2,
} from '@/components/icons'
import { GridSkeleton } from '@/components/LoadingSkeleton'
import { getLSJSON, getLS } from '@/lib/storage'

/* ─── Hero Carousel ─── */
const BANNERS = ['/banner-1.png', '/banner-2.png', '/banner-3.png']

function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const touchStart = useRef(0)

  const next = useCallback(() => setCurrent((c) => (c + 1) % BANNERS.length), [])

  useEffect(() => {
    timerRef.current = setInterval(next, 4000)
    return () => clearInterval(timerRef.current)
  }, [next])

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      clearInterval(timerRef.current)
      setCurrent((c) => diff > 0 ? (c + 1) % BANNERS.length : (c - 1 + BANNERS.length) % BANNERS.length)
      timerRef.current = setInterval(next, 4000)
    }
  }

  return (
    <div className="px-5 mt-4 animate-slide-up">
      <div
        className="relative rounded-2xl overflow-hidden shadow-md"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {BANNERS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Promo ${i + 1}`}
              className="w-full h-40 object-cover shrink-0"
              draggable={false}
            />
          ))}
        </div>
        {/* Dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); clearInterval(timerRef.current); timerRef.current = setInterval(next, 4000) }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-white shadow-md' : 'w-2 h-2 bg-white/50'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Static Data ─── */
const CATEGORIES = [
  { name: 'Food', icon: Store },
  { name: 'Coffee', icon: Coffee },
  { name: 'Bakery', icon: Cake },
  { name: 'Non Coffee', icon: UtensilsCrossed },
]

const FEATURES = [
  {
    icon: Truck,
    title: 'Gratis Ongkir',
    desc: 'Min. belanja Rp 40rb, area kampus',
  },
  {
    icon: Clock,
    title: 'Cepat & Tepat',
    desc: 'Pesanan diproses hari ini juga',
  },
  {
    icon: CheckCircle2,
    title: 'Fresh Daily',
    desc: 'Bahan segar setiap hari',
  },
  {
    icon: Heart,
    title: 'Homemade',
    desc: 'Dibuat dengan cinta & resep terbaik',
  },
]

const REVIEWS = [
  { name: 'Rina S.', text: 'Kopi nya enak banget, pengiriman cepat!', rating: 5 },
  { name: 'Dimas A.', text: 'Bakery favorit sekeluarga. Roti nya fresh!', rating: 5 },
  { name: 'Sari M.', text: 'Harga terjangkau, rasa ga murahan 👍', rating: 4 },
]

/* ─── Store Info (from admin settings via localStorage) ─── */
const STORE_DEFAULTS = {
  address: 'Jl. Telekomunikasi No. 1, Sukapura, Dayeuhkolot, Bandung, Jawa Barat 40257',
  phone: '628123456789',
  lat: -6.9733,
  lng: 107.6307,
}

const OPERATING_HOURS = [
  { day: 'Senin - Jumat', time: '08.00 - 17.00' },
  { day: 'Sabtu', time: '08.00 - 15.00' },
  { day: 'Minggu', time: 'Tutup' },
]

/* ─── Component ─── */
export default function HomePage() {
  const router = useRouter()
  const [showAlert, setShowAlert] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)
  const [storeAddress, setStoreAddress] = useState(STORE_DEFAULTS.address)
  const [storePhone, setStorePhone] = useState(STORE_DEFAULTS.phone)

  useEffect(() => {
    /* One-time alert */
    try {
      if (!sessionStorage.getItem('jcAlert')) {
        setTimeout(() => {
          setShowAlert(true)
          sessionStorage.setItem('jcAlert', '1')
        }, 900)
      }
    } catch { /* incognito */ }

    /* Cart count */
    const cart = getLSJSON('cart', [])
    setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0))

    /* Store settings from admin */
    setStoreAddress(getLS('store_address', STORE_DEFAULTS.address))
    setStorePhone(getLS('store_phone', STORE_DEFAULTS.phone))

    /* Popular products */
    const fetchPopular = async () => {
      const { data } = await supabase.from('products').select('*').limit(4)
      setPopular(data || [])
      setLoading(false)
    }
    fetchPopular()
  }, [])

  const waLink = `https://wa.me/${storePhone}`
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`

  return (
    <>
      {/* ─── Order Deadline Alert Modal ─── */}
      {showAlert && (
        <div
          className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-5 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAlert(false)}
        >
          <div
            className="bg-surface w-full rounded-3xl p-8 text-center shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Clock size={28} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-text mb-2">Batas Waktu Pemesanan</h2>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Pemesanan ditutup setiap hari{' '}
              <strong className="text-text">pukul 14.00 WIB</strong>.
              Pesan lebih awal agar diproses hari ini!
            </p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold btn-press shadow-lg"
            >
              Oke, Mengerti!
            </button>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex justify-between items-center border-b border-border animate-slide-down">
        <Link href="/" className="btn-press" aria-label="Beranda J-Corners">
          <p className="text-[11px] text-text-secondary font-medium">Selamat datang di,</p>
          <h1 className="text-xl font-extrabold text-text tracking-tight">J-Corners</h1>
        </Link>
        <Link
          href="/cart"
          className="relative w-11 h-11 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press"
          aria-label="Keranjang"
        >
          <ShoppingBag size={19} className="text-text" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md animate-scale-in">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {/* ─── Hero Carousel ─── */}
      <HeroCarousel />

      {/* ─── Info Banner ─── */}
      <div className="px-5 mt-4 mb-6 animate-slide-up">
        <div
          onClick={() => setShowAlert(true)}
          className="bg-primary text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg cursor-pointer btn-press overflow-hidden relative"
        >
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/5 rounded-full blur-xl" />

          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shrink-0">
            <Clock size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Order Sebelum 14.00!</h3>
            <p className="text-[11px] text-white/70 mt-0.5">Tap untuk info pengiriman</p>
          </div>
        </div>
      </div>

      {/* ─── Categories ─── */}
      <div className="px-5 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-[15px] font-bold text-text">Kategori</h2>
          <Link href="/menu" className="text-xs font-bold text-primary">
            Lihat Semua
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide stagger-children">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.name}
                onClick={() => router.push(`/menu?cat=${cat.name}`)}
                className="flex flex-col items-center gap-2 min-w-[72px] animate-slide-up"
              >
                <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center shadow-sm border border-border text-primary card-hover">
                  <Icon size={26} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-text">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Popular Items ─── */}
      <div className="px-5 mb-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-accent" />
          <h2 className="text-[15px] font-bold text-text">Paling Diminati</h2>
        </div>

        {loading ? (
          <GridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-4 stagger-children">
            {popular.map((item) => (
              <Link
                key={item.id}
                href={`/menu/${item.id}`}
                className="bg-surface rounded-3xl p-3 shadow-sm border border-border flex flex-col card-hover animate-slide-up"
              >
                <div className="w-full h-28 rounded-2xl bg-surface-alt overflow-hidden mb-3">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75'}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    alt={item.name}
                  />
                </div>
                <h3 className="text-xs font-bold text-text line-clamp-1">{item.name}</h3>
                <p className="text-primary font-extrabold text-sm mt-auto pt-2">
                  Rp {item.price?.toLocaleString('id-ID')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── Outlet Location — Interactive Map ─── */}
      <div className="px-5 mb-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-primary" />
          <h2 className="text-[15px] font-bold text-text">Lokasi Outlet</h2>
        </div>

        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-border">
          {/* Embedded Map — draggable/interactive */}
          <div className="w-full h-48 bg-surface-alt relative overflow-hidden">
            <iframe
              title="Lokasi J-Corners"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Address & Actions */}
          <div className="p-4">
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              {storeAddress}
            </p>
            <div className="flex gap-2">
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-[11px] font-bold btn-press flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Navigation2 size={13} />
                Navigasi
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-success text-white py-2.5 rounded-xl text-[11px] font-bold btn-press flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Phone size={13} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Operating Hours ─── */}
      <div className="px-5 mb-8 animate-slide-up" style={{ animationDelay: '350ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-accent" />
          <h2 className="text-[15px] font-bold text-text">Jam Operasional</h2>
        </div>

        <div className="bg-surface rounded-3xl p-4 shadow-sm border border-border">
          <div className="space-y-2.5">
            {OPERATING_HOURS.map((item) => (
              <div
                key={item.day}
                className="flex justify-between items-center"
              >
                <span className="text-xs font-semibold text-text">{item.day}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                  item.time === 'Tutup'
                    ? 'bg-danger-light text-danger'
                    : 'bg-primary-light text-primary'
                }`}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Why Choose Us ─── */}
      <div className="px-5 mb-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Heart size={16} className="text-primary" />
          <h2 className="text-[15px] font-bold text-text">Kenapa J-Corners?</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-surface rounded-2xl p-4 shadow-sm border border-border text-center card-hover"
              >
                <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="text-[11px] font-bold text-text mb-1">{f.title}</h3>
                <p className="text-[10px] text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Customer Reviews ─── */}
      <div className="px-5 mb-8 animate-slide-up" style={{ animationDelay: '450ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-accent" />
          <h2 className="text-[15px] font-bold text-text">Kata Mereka</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className="bg-surface rounded-2xl p-4 shadow-sm border border-border min-w-[240px] snap-start shrink-0"
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={12}
                    className={j < r.rating ? 'text-accent fill-accent' : 'text-border'}
                  />
                ))}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-3 italic">
                &ldquo;{r.text}&rdquo;
              </p>
              <p className="text-[10px] font-bold text-text">{r.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="pb-32 animate-slide-up" style={{ animationDelay: '500ms' }}>
        <div className="mx-5 bg-primary rounded-3xl p-6 text-center overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full blur-xl" />

          <div className="relative z-10">
            <h3 className="text-white font-extrabold text-lg mb-1">J-Corners</h3>
            <p className="text-white/60 text-[11px] mb-4">Fresh Bakery & Premium Coffee</p>

            <div className="flex justify-center gap-3 mb-4">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center btn-press backdrop-blur-sm"
              >
                <Phone size={15} className="text-white" />
              </a>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center btn-press backdrop-blur-sm"
              >
                <MapPin size={15} className="text-white" />
              </a>
            </div>

            <p className="text-white/40 text-[9px]">
              © 2026 J-Corners. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}