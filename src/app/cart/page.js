'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLS, getLSJSON, setLSJSON, removeLS } from '@/lib/storage'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import FormField from '@/components/FormField'
import {
  ShoppingBag, User, Truck, Plus, Minus, X,
  CreditCard, ScanLine, Loader2, CheckCircle2,
  MapPin, Upload, Tag,
} from '@/components/icons'

/* Alamat toko default — admin bisa update di dashboard */
const DEFAULT_STORE_ADDRESS = 'Jl. Telekomunikasi No. 1, Sukapura, Dayeuhkolot, Bandung, Jawa Barat 40257'
const DEFAULT_WA = '6285137610502'

/* Ongkir logic: gratis ≥ 40rb, Rp 5rb untuk 25-39rb, Rp 10rb < 25rb */
const getOngkir = (subtotal, type) => {
  if (type === 'pickup') return 0
  if (subtotal >= 40000) return 0
  if (subtotal >= 25000) return 5000
  return 10000
}

/* Admin fee for transfer/QRIS */
const ADMIN_FEE = 1500

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [type, setType] = useState('delivery')
  const [nama, setNama] = useState('')
  const [noHp, setNoHp] = useState('')
  const [alamat, setAlamat] = useState('')
  const [payment, setPayment] = useState('cash')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [storeAddress, setStoreAddress] = useState(DEFAULT_STORE_ADDRESS)
  const [storeWa, setStoreWa] = useState(DEFAULT_WA)
  const [qrisUrl, setQrisUrl] = useState('')
  const [bankAccounts, setBankAccounts] = useState([])
  const [showAllBanks, setShowAllBanks] = useState(false)

  /* Promo */
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')

  /* Address autocomplete */
  const [addrSuggestions, setAddrSuggestions] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const addrTimeout = useRef(null)

  useEffect(() => {
    const localCart = getLSJSON('cart', [])

    /* Validate cart — remove items that admin has deleted */
    const validateCart = async () => {
      if (localCart.length === 0) { setCart([]); return }
      const { data: liveProducts } = await supabase.from('products').select('id')
      if (liveProducts) {
        const liveIds = new Set(liveProducts.map((p) => p.id))
        const validCart = localCart.filter((item) => liveIds.has(item.id))
        if (validCart.length !== localCart.length) {
          setLSJSON('cart', validCart)
        }
        setCart(validCart)
      } else {
        setCart(localCart)
      }
    }
    validateCart()

    /* Load store settings from localStorage (set by admin) */
    const savedAddr = getLS('store_address')
    if (savedAddr) setStoreAddress(savedAddr)
    const savedWa = getLS('store_phone')
    if (savedWa) setStoreWa(savedWa)
    setQrisUrl(getLS('store_qris_url', ''))
    setBankAccounts(getLSJSON('store_banks', []))
  }, [])

  /* ─── Address Autocomplete (Nominatim) ─── */
  const searchAddress = (query) => {
    setAlamat(query)
    if (addrTimeout.current) clearTimeout(addrTimeout.current)
    if (query.length < 5) { setAddrSuggestions([]); return }
    addrTimeout.current = setTimeout(async () => {
      setAddrLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=5&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setAddrSuggestions(data.map((d) => ({ display: d.display_name, lat: d.lat, lon: d.lon })))
      } catch (_e) { setAddrSuggestions([]) }
      setAddrLoading(false)
    }, 600)
  }
  const selectAddress = (addr) => {
    setAlamat(addr.display)
    setAddrSuggestions([])
  }

  /* ─── Cart Helpers ─── */
  const saveCart = (updated) => {
    setCart(updated)
    setLSJSON('cart', updated)
  }

  const increment = (id) =>
    saveCart(cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)))

  const decrement = (id) =>
    saveCart(cart.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)))

  const removeItem = (id) =>
    saveCart(cart.filter((i) => i.id !== id))

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const ongkir = getOngkir(subtotal, type)
  const adminFee = payment === 'qris' ? ADMIN_FEE : 0

  /* Promo discount calculation */
  let discount = 0
  if (promoApplied) {
    if (promoApplied.discount_percent > 0) {
      discount = Math.floor(subtotal * promoApplied.discount_percent / 100)
    }
    if (promoApplied.discount_amount > 0) {
      discount += promoApplied.discount_amount
    }
  }
  const total = Math.max(0, subtotal + ongkir + adminFee - discount)

  /* ─── Apply Promo ─── */
  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      setPromoError('Kode promo tidak ditemukan atau tidak aktif')
      setPromoApplied(null)
    } else if (data.min_order > 0 && subtotal < data.min_order) {
      setPromoError(`Min. order ${data.min_order.toLocaleString('id-ID')} untuk promo ini`)
      setPromoApplied(null)
    } else if (data.max_usage > 0 && data.usage_count >= data.max_usage) {
      setPromoError('Kuota promo sudah habis')
      setPromoApplied(null)
    } else if (data.valid_until && new Date(data.valid_until) < new Date()) {
      setPromoError('Promo sudah expired')
      setPromoApplied(null)
    } else {
      setPromoApplied(data)
      setPromoError('')
    }
    setPromoLoading(false)
  }

  const removePromo = () => {
    setPromoApplied(null)
    setPromoCode('')
    setPromoError('')
  }

  /* ─── Show Toast ─── */
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  /* ─── Order Submission ─── */
  const handleOrder = async () => {
    if (!nama.trim()) return showToast('⚠️ Masukkan nama kamu!')
    if (!noHp.trim()) return showToast('⚠️ Masukkan nomor HP!')
    if (type === 'delivery' && !alamat.trim()) return showToast('⚠️ Masukkan alamat pengiriman!')
    if (payment === 'qris' && !file) return showToast('⚠️ Upload bukti transfer!')

    setLoading(true)
    let buktiUrl = null

    try {
      /* Upload bukti transfer */
      if (payment === 'qris' && file) {
        const ext = file.name.split('.').pop()
        const fname = `bukti_${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('bukti-transfer').upload(fname, file)
        if (!error) {
          buktiUrl = supabase.storage.from('bukti-transfer').getPublicUrl(fname).data.publicUrl
        }
      }

      /* Insert order — only use columns that exist in the orders table */
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          nama_pembeli: nama,
          no_hp: noHp,
          alamat: type === 'delivery' ? alamat : 'Pickup',
          total_harga: total,
          metode_bayar: payment,
          bukti_transfer: buktiUrl,
          items: cart.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          status: 'Menunggu',
        }])
        .select()

      if (orderError) {
        console.error('Order error:', orderError)
        showToast('❌ Gagal memesan! Coba lagi.')
        setLoading(false)
        return
      }

      /* Increment promo usage if applied */
      if (promoApplied) {
        try {
          await supabase.from('promo_codes').update({ usage_count: (promoApplied.usage_count || 0) + 1 }).eq('id', promoApplied.id)
        } catch (_e) { /* ignore if promo_codes table doesn't exist yet */ }
      }

      /* Save order ID locally */
      const myOrders = getLSJSON('my_orders', [])
      myOrders.push(orderData[0].id)
      setLSJSON('my_orders', myOrders)

      /* Build WhatsApp message */
      const itemsText = cart.map((i) => `• ${i.name} (x${i.quantity})`).join('\n')
      const ongkirInfo = ongkir === 0 ? 'GRATIS' : `Rp ${ongkir.toLocaleString('id-ID')}`
      const adminFeeInfo = adminFee > 0 ? `Rp ${adminFee.toLocaleString('id-ID')}` : '-'
      const msg = encodeURIComponent(
        `*ORDER BARU - J-CORNERS*\nID: ${orderData[0].id.slice(0, 8).toUpperCase()}\n\nNama: ${nama}\nHP: ${noHp}\nTipe: ${type === 'delivery' ? 'Delivery' : 'Pickup'}\n${
          type === 'delivery' ? `Alamat: ${alamat}\n` : ''
        }Metode: ${payment.toUpperCase()}\n\n*Pesanan:*\n${itemsText}\n\nSubtotal: Rp ${subtotal.toLocaleString('id-ID')}\nOngkir: ${ongkirInfo}${adminFee > 0 ? `\nBiaya Admin: ${adminFeeInfo}` : ''}${discount > 0 ? `\nDiskon (${promoApplied?.code}): -Rp ${discount.toLocaleString('id-ID')}` : ''}\n*Total: Rp ${total.toLocaleString('id-ID')}*${
          buktiUrl ? `\nBukti: ${buktiUrl}` : ''
        }`
      )

      removeLS('cart')
      setCart([])
      setOrderSuccess(true)

      setTimeout(() => {
        window.open(`https://wa.me/${storeWa}?text=${msg}`, '_blank')
      }, 1500)

      setTimeout(() => {
        router.push('/history')
      }, 2500)
    } catch (err) {
      console.error('Unexpected error:', err)
      showToast('❌ Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  /* ─── Success State ─── */
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mb-5 animate-scale-in">
          <CheckCircle2 size={40} className="text-success" />
        </div>
        <h2 className="text-xl font-extrabold text-text mb-2">Pesanan Berhasil! 🎉</h2>
        <p className="text-sm text-text-secondary mb-2 leading-relaxed max-w-[280px]">
          Pesananmu sedang dikirim ke WhatsApp. Admin akan segera mengkonfirmasi.
        </p>
        <p className="text-xs text-text-tertiary mb-6">Mengalihkan ke riwayat pesanan...</p>
        <div className="w-8 h-8 border-[3px] border-surface-alt border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  /* ─── Empty State ─── */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader title="Keranjang" onBack={() => router.push('/')} />
        <EmptyState
          icon={ShoppingBag}
          title="Keranjang Kosong"
          description="Belum ada item di keranjangmu"
          actionLabel="Pesan Sekarang"
          actionHref="/menu"
        />
      </div>
    )
  }

  return (
    <>
    <main className="min-h-screen bg-surface-alt pb-32 relative">
      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-text text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-xl animate-slide-down max-w-[90%] text-center">
          {toast}
        </div>
      )}

      {/* ─── Header ─── */}
      <PageHeader title="Detail Pesanan" onBack={() => router.back()} />

      {/* ─── Order Type Toggle (simple, like home category) ─── */}
      <div className="px-5 mt-4 mb-5 animate-slide-up">
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
          Tipe Pengambilan
        </label>
        <div className="flex gap-2">
          {[
            { key: 'pickup', label: 'Pickup', icon: User },
            { key: 'delivery', label: 'Delivery', icon: Truck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 btn-press border ${
                type === key
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-surface text-text-secondary border-border'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Pickup: Show store address ─── */}
      {type === 'pickup' && (
        <div className="px-5 mb-5 animate-scale-in">
          <div className="bg-primary-light rounded-2xl p-4 flex items-start gap-3 border border-primary/10">
            <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                Alamat Toko (Ambil di Sini)
              </p>
              <p className="text-sm text-text font-medium leading-relaxed">{storeAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Form ─── */}
      <div className="px-5 mb-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
          <FormField
            label="Nama Pemesan"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap..."
            required
          />
          <FormField
            label="No. HP / WhatsApp"
            type="tel"
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            placeholder="08xxxxxxxxxx"
            required
          />
          {type === 'delivery' && (
            <div className="relative">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                <MapPin size={12} /> Alamat Pengiriman
              </label>
              <textarea
                value={alamat}
                onChange={(e) => searchAddress(e.target.value)}
                placeholder="Ketik alamat, suggestions akan muncul..."
                rows={2}
                className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text resize-none"
              />
              {addrLoading && <p className="text-[9px] text-text-tertiary mt-1 animate-pulse">Mencari alamat...</p>}
              {addrSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-surface border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {addrSuggestions.map((s, i) => (
                    <button key={i} onClick={() => selectAddress(s)} className="w-full text-left px-4 py-3 text-xs text-text hover:bg-primary-light border-b border-border last:border-0 transition-colors">
                      <span className="font-bold">{s.display.split(',')[0]}</span>
                      <span className="text-text-tertiary">, {s.display.split(',').slice(1).join(',')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Cart Items ─── */}
      <div className="px-5 space-y-3 mb-6 stagger-children">
        {cart.map((item) => (
          <div
            key={item.id}
            className="bg-surface p-3 rounded-3xl flex items-center gap-4 shadow-sm border border-border relative animate-slide-up"
          >
            <button
              onClick={() => removeItem(item.id)}
              className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 btn-press"
              aria-label={`Hapus ${item.name}`}
            >
              <X size={12} strokeWidth={3} />
            </button>

            <div className="w-20 h-20 bg-surface-alt rounded-2xl overflow-hidden shrink-0">
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-text truncate">{item.name}</h3>
              {item.notes && (
                <p className="text-[10px] text-text-secondary truncate mt-0.5">{item.notes}</p>
              )}
              <p className="font-extrabold text-sm mt-2 text-primary">
                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Quantity — simple inline stepper */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => decrement(item.id)}
                className="w-8 h-8 rounded-xl bg-surface-alt border border-border flex items-center justify-center text-text-secondary btn-press"
                aria-label="Kurangi"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-bold text-text w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => increment(item.id)}
                className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center btn-press"
                aria-label="Tambah"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Promo Code ─── */}
      <div className="px-5 mb-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-surface rounded-3xl p-4 shadow-sm border border-border">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block flex items-center gap-1.5">
            <Tag size={12} /> Kode Promo
          </label>
          {promoApplied ? (
            <div className="flex items-center gap-2 bg-success-light p-3 rounded-xl border border-success/20">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-success">{promoApplied.code}</p>
                <p className="text-[10px] text-text-secondary">
                  {promoApplied.discount_percent > 0 && `Diskon ${promoApplied.discount_percent}%`}
                  {promoApplied.discount_percent > 0 && promoApplied.discount_amount > 0 && ' + '}
                  {promoApplied.discount_amount > 0 && `Potongan Rp ${promoApplied.discount_amount.toLocaleString('id-ID')}`}
                </p>
              </div>
              <button onClick={removePromo} className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center btn-press">
                <X size={12} className="text-text-secondary" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode..."
                className="flex-1 px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-bold text-text uppercase"
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading}
                className="px-4 py-3 bg-primary text-white rounded-xl text-xs font-bold btn-press disabled:opacity-60"
              >
                {promoLoading ? '...' : 'Pakai'}
              </button>
            </div>
          )}
          {promoError && (
            <p className="text-[10px] text-danger font-bold mt-2">{promoError}</p>
          )}
        </div>
      </div>

      {/* ─── Payment Section ─── */}
      <div className="px-5 mb-5 animate-slide-up" style={{ animationDelay: '120ms' }}>
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border">
          {/* Subtotal & Ongkir */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm text-text-secondary font-medium">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {type === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Ongkir</span>
                <span className={`font-bold ${ongkir === 0 ? 'text-success' : 'text-text'}`}>
                  {ongkir === 0 ? '🎉 Gratis!' : `Rp ${ongkir.toLocaleString('id-ID')}`}
                </span>
              </div>
            )}
            {type === 'delivery' && subtotal < 40000 && (
              <p className="text-[10px] text-text-tertiary">
                Belanja <span className="font-bold text-primary">Rp {(40000 - subtotal).toLocaleString('id-ID')}</span> lagi untuk gratis ongkir!
              </p>
            )}
            {payment === 'qris' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Biaya Admin</span>
                <span className="text-text font-bold">Rp {ADMIN_FEE.toLocaleString('id-ID')}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success font-bold">Diskon ({promoApplied?.code})</span>
                <span className="text-success font-bold">-Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
          <div className="border-t border-dashed border-border pt-3 flex justify-between items-center mb-6">
            <span className="font-extrabold text-lg text-text">Total</span>
            <span className="font-extrabold text-lg text-primary">Rp {total.toLocaleString('id-ID')}</span>
          </div>

          {/* Payment Method — simple toggle like type selector */}
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
            Metode Pembayaran
          </label>
          <div className="flex gap-2 mb-4">
            {[
              { key: 'cash', label: 'Cash / COD', icon: CreditCard },
              { key: 'qris', label: 'Transfer / QRIS', icon: ScanLine },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setPayment(key)}
                className={`flex-1 py-3 text-xs font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-1.5 btn-press border ${
                  payment === key
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-surface-alt text-text-secondary border-border'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* QRIS / Transfer Upload */}
          {payment === 'qris' && (
            <div className="bg-surface-alt p-4 rounded-2xl border border-border animate-scale-in space-y-3">
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest text-center">
                Transfer / QRIS
              </p>

              {/* QRIS Image from admin settings */}
              {qrisUrl ? (
                <img
                  src={qrisUrl}
                  alt="QRIS"
                  className="w-36 h-36 mx-auto object-contain rounded-xl border border-border bg-white"
                />
              ) : (
                <img
                  src="/qris.png"
                  alt="QRIS"
                  className="w-28 h-28 mx-auto object-contain mix-blend-multiply rounded-xl"
                />
              )}

              {/* Bank accounts from admin settings */}
              {bankAccounts.length > 0 && bankAccounts[0].bank && (
                <div className="space-y-2">
                  <div className="bg-surface rounded-xl p-3 border border-border text-center">
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mb-1">Rekening Transfer</p>
                    <p className="text-sm font-bold text-text">{bankAccounts[0].bank}</p>
                    <p className="text-base font-extrabold text-primary tracking-wider">{bankAccounts[0].account}</p>
                  </div>
                  {bankAccounts.length > 1 && (
                    <>
                      <button onClick={() => setShowAllBanks(true)} className="w-full text-[10px] font-bold text-primary bg-primary-light py-2 rounded-xl btn-press">
                        Rekening Lainnya ({bankAccounts.length - 1})
                      </button>
                    </>
                  )}
                </div>
              )}

              <p className="text-[10px] text-text-secondary text-center leading-relaxed">
                Scan QRIS atau transfer ke rekening di atas, lalu upload bukti
              </p>

              <div className="bg-primary-light rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-primary font-bold">
                  ⓘ Biaya admin Rp {ADMIN_FEE.toLocaleString('id-ID')} untuk metode ini
                </p>
              </div>

              {/* File upload */}
              <label className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-2xl font-bold text-sm cursor-pointer btn-press border border-primary">
                <Upload size={16} />
                {file ? file.name : 'Upload Bukti Transfer'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {file && (
                <p className="text-[10px] text-success font-bold text-center">
                  ✓ File terpilih: {file.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Submit Button ─── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-5 pt-3 bg-gradient-to-t from-surface-alt via-surface-alt to-transparent z-50">
        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-full font-bold text-sm shadow-lg btn-press flex items-center justify-center gap-2 disabled:opacity-60 transition-colors duration-200"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Memproses...
            </>
          ) : (
            `Bayar — Rp ${total.toLocaleString('id-ID')}`
          )}
        </button>
      </div>
    </main>

    {/* ═══ All Banks Popup ═══ */}
    {showAllBanks && (
      <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-5 backdrop-blur-sm animate-fade-in" onClick={() => setShowAllBanks(false)}>
        <div className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-extrabold text-text">Rekening Tersedia</h3>
            <button onClick={() => setShowAllBanks(false)} className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center btn-press"><X size={14} /></button>
          </div>
          <div className="space-y-3">
            {bankAccounts.filter((b) => b.bank).map((b, i) => (
              <div key={i} className="bg-surface-alt rounded-xl p-4 border border-border text-center">
                <p className="text-xs font-bold text-text">{b.bank}</p>
                <p className="text-lg font-extrabold text-primary tracking-wider mt-1">{b.account}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  )
}