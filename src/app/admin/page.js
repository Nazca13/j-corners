'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import FormField from '@/components/FormField'
import { PageLoader } from '@/components/LoadingSkeleton'
import {
  RefreshCw, LogOut, ClipboardList, Store, Plus, X,
  MapPin, CreditCard, Link2, Edit3, Trash2, Loader2,
  Package, CheckCircle2, Truck as TruckIcon, Clock, Upload, ScanLine,
} from '@/components/icons'
import { getLS, setLS } from '@/lib/storage'

/* ─── Constants ─── */
const STATUS_FLOW = ['Menunggu', 'Diproses', 'Diantar', 'Selesai']
const CATEGORIES = ['Food', 'Bakery', 'Coffee', 'Non Coffee']

const INITIAL_FORM = {
  id: null,
  name: '',
  category: 'Food',
  price: '',
  description: '',
  image: null,
  existing_image: '',
  available: true,
}

/* Format number with dots: 25000 → 25.000 */
const fmtPrice = (v) => {
  const num = String(v).replace(/\D/g, '')
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
const parsePrice = (v) => parseInt(String(v).replace(/\./g, ''), 10) || 0

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('orders')
  const [loading, setLoading] = useState(true)

  /* Orders */
  const [orders, setOrders] = useState([])
  const [updatingId, setUpdatingId] = useState(null)

  /* Menu */
  const [products, setProducts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  /* Settings */
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [qrisImage, setQrisImage] = useState(null)
  const [qrisUrl, setQrisUrl] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)

  /* ─── Auth & Fetch ─── */
  const checkAuthAndFetch = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const [{ data: orderData }, { data: productData }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ])

    setOrders(orderData || [])
    setProducts(productData || [])
    setLoading(false)
  }

  useEffect(() => {
    checkAuthAndFetch()

    /* Load settings from localStorage */
    setStoreAddress(getLS('store_address', 'Jl. Telekomunikasi No. 1, Sukapura, Dayeuhkolot, Bandung, Jawa Barat 40257'))
    setStorePhone(getLS('store_phone', '628123456789'))
    setQrisUrl(getLS('store_qris_url', ''))
    setBankAccount(getLS('store_bank_account', ''))
    setBankName(getLS('store_bank_name', ''))
  }, [router])

  /* ─── Dashboard Stats ─── */
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'Menunggu').length,
    processing: orders.filter((o) => o.status === 'Diproses').length,
    delivering: orders.filter((o) => o.status === 'Diantar').length,
    completed: orders.filter((o) => o.status === 'Selesai').length,
    revenue: orders.reduce((sum, o) => sum + (o.total_harga || 0), 0),
    menuCount: products.length,
  }

  /* ─── Order Actions ─── */
  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    }
    setUpdatingId(null)
  }

  /* ─── Menu Actions ─── */
  const openModal = (product = null) => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name,
        category: product.category,
        price: fmtPrice(product.price),
        description: product.description || '',
        image: null,
        existing_image: product.image_url || '',
        available: product.available !== false,
      })
    } else {
      setForm(INITIAL_FORM)
    }
    setModalOpen(true)
  }

  const handleDeleteMenu = async (id) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSaveMenu = async (e) => {
    e.preventDefault()
    setSaving(true)
    let imageUrl = form.existing_image

    if (form.image) {
      const ext = form.image.name.split('.').pop()
      const fname = `menu_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(fname, form.image)
      if (!error) {
        imageUrl = supabase.storage.from('product-images').getPublicUrl(fname).data.publicUrl
      }
    }

    const payload = {
      name: form.name,
      category: form.category,
      price: parsePrice(form.price),
      description: form.description,
      image_url: imageUrl,
      available: form.available,
    }

    if (form.id) {
      const { data, error } = await supabase.from('products').update(payload).eq('id', form.id).select()
      if (!error) setProducts((prev) => prev.map((p) => (p.id === form.id ? data[0] : p)))
    } else {
      const { data, error } = await supabase.from('products').insert([payload]).select()
      if (!error) setProducts((prev) => [data[0], ...prev])
    }

    setSaving(false)
    setModalOpen(false)
  }

  /* ─── Settings Actions ─── */
  const handleSaveSettings = async () => {
    setLS('store_address', storeAddress)
    setLS('store_phone', storePhone)
    setLS('store_bank_account', bankAccount)
    setLS('store_bank_name', bankName)

    // Upload QRIS image if new one selected
    if (qrisImage) {
      const ext = qrisImage.name.split('.').pop()
      const fname = `qris_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(fname, qrisImage)
      if (!error) {
        const url = supabase.storage.from('product-images').getPublicUrl(fname).data.publicUrl
        setQrisUrl(url)
        setLS('store_qris_url', url)
      }
    }

    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  /* ─── Loading ─── */
  if (loading) return <PageLoader />

  return (
    <main className="min-h-screen bg-bg pb-12">
      {/* ─── Settings Saved Toast ─── */}
      {settingsSaved && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-success text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-xl animate-slide-down flex items-center gap-2">
          <CheckCircle2 size={16} />
          Pengaturan tersimpan!
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="bg-surface px-5 py-4 sticky top-0 z-40 shadow-sm border-b border-border flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-lg font-extrabold text-text tracking-tight leading-none">
            Dapur J-Corners
          </h1>
          <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-0.5">
            Panel Owner
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkAuthAndFetch}
            className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center text-primary btn-press"
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-danger-light rounded-full flex items-center justify-center text-danger btn-press"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ─── Stats Dashboard ─── */}
      <div className="px-4 pt-4 pb-2 animate-slide-up">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'text-primary', bg: 'bg-primary-light' },
            { label: 'Diproses', value: stats.processing, icon: Package, color: 'text-primary', bg: 'bg-primary-light' },
            { label: 'Diantar', value: stats.delivering, icon: TruckIcon, color: 'text-primary', bg: 'bg-primary-light' },
            { label: 'Selesai', value: stats.completed, icon: CheckCircle2, color: 'text-success', bg: 'bg-success-light' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-3 text-center border border-border`}>
              <Icon size={16} className={`${color} mx-auto mb-1`} />
              <p className={`text-lg font-extrabold ${color}`}>{value}</p>
              <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 bg-surface rounded-2xl px-4 py-3 flex justify-between items-center border border-border">
          <div>
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Total Pendapatan</p>
            <p className="text-lg font-extrabold text-primary">Rp {stats.revenue.toLocaleString('id-ID')}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Menu Aktif</p>
            <p className="text-lg font-extrabold text-text">{stats.menuCount}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="px-4 pb-2 bg-bg sticky top-[73px] z-30 pt-2">
        <div className="flex bg-surface p-1 rounded-xl border border-border gap-1">
          {[
            { key: 'orders', label: 'Pesanan', icon: ClipboardList, count: stats.pending },
            { key: 'menu', label: 'Menu', icon: Store },
            { key: 'settings', label: 'Pengaturan', icon: MapPin },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 btn-press relative ${
                activeTab === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-tertiary'
              }`}
            >
              <Icon size={14} />
              {label}
              {count > 0 && key === 'orders' && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* ─── ORDERS VIEW ─── */}
        {activeTab === 'orders' && (
          <div className="space-y-4 stagger-children">
            {orders.length === 0 ? (
              <div className="text-center py-20 text-text-tertiary font-medium text-sm animate-fade-in">
                Belum ada pesanan aktif.
              </div>
            ) : (
              orders.map((order) => {
                const isUpdating = updatingId === order.id
                return (
                  <div
                    key={order.id}
                    className="bg-surface rounded-3xl p-5 shadow-sm border border-border relative overflow-hidden animate-slide-up"
                  >
                    {/* Accent bar */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-text">{order.nama_pembeli}</h3>
                        <p className="text-[10px] text-text-tertiary font-mono mt-0.5">
                          #{order.id?.slice(0, 8).toUpperCase()} •{' '}
                          {new Date(order.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {order.no_hp && (
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            HP: {order.no_hp}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-primary leading-none">
                          Rp {order.total_harga?.toLocaleString('id-ID')}
                        </p>
                        <div className="mt-2">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.alamat && (
                        <span className="text-[10px] text-text-secondary bg-surface-alt px-2 py-1 rounded-lg border border-border inline-flex items-center gap-1 w-fit">
                          <MapPin size={10} className="text-text-tertiary shrink-0" />
                          <span className="truncate max-w-[150px]">{order.alamat}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-text-secondary bg-surface-alt px-2 py-1 rounded-lg border border-border inline-flex items-center gap-1 w-fit">
                        <CreditCard size={10} className="text-text-tertiary" />
                        {order.metode_bayar === 'qris' ? 'QRIS/Transfer' : 'Cash'}
                      </span>
                    </div>

                    {/* Order Items */}
                    {order.items?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {order.items.map((item, i) => (
                          <span
                            key={i}
                            className="bg-primary-light text-text text-[9px] font-bold px-2 py-1 rounded-lg"
                          >
                            {item.name} <span className="text-primary">x{item.quantity}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Proof Link */}
                    {order.bukti_transfer && (
                      <a
                        href={order.bukti_transfer}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mb-3 bg-primary-light text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg border border-primary/10 btn-press"
                      >
                        <Link2 size={11} />
                        Lihat Bukti Transfer
                      </a>
                    )}

                    {/* Status Update */}
                    <div className="pt-3 border-t border-dashed border-border">
                      <p className="text-[9px] font-bold text-text-tertiary mb-2 uppercase tracking-widest">
                        Update Status
                      </p>
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                        {STATUS_FLOW.map((status) => (
                          <button
                            key={status}
                            onClick={() => updateStatus(order.id, status)}
                            disabled={isUpdating}
                            className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 btn-press ${
                              order.status === status
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-surface-alt text-text-tertiary border border-border'
                            }`}
                          >
                            {isUpdating && order.status === status ? '...' : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ─── MENU VIEW ─── */}
        {activeTab === 'menu' && (
          <div>
            <button
              onClick={() => openModal()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg mb-6 flex justify-center items-center gap-2 btn-press"
            >
              <Plus size={18} strokeWidth={2.5} />
              Tambah Menu Baru
            </button>

            <div className="grid grid-cols-2 gap-3 stagger-children">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col relative animate-slide-up"
                >
                  {p.available === false && (
                    <div className="absolute top-2 left-2 bg-danger text-white text-[8px] font-bold px-2 py-1 rounded-md z-10">
                      HABIS
                    </div>
                  )}

                  <div className={`h-24 bg-surface-alt relative ${p.available === false ? 'grayscale opacity-50' : ''}`}>
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-xs font-bold text-text line-clamp-1">{p.name}</h3>
                    <p className="text-[9px] text-text-tertiary mt-0.5">{p.category}</p>
                    <p className="text-sm font-extrabold text-primary mt-1 mb-3">
                      Rp {p.price?.toLocaleString('id-ID')}
                    </p>

                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => openModal(p)}
                        className="flex-1 bg-surface-alt text-text py-1.5 rounded-lg text-[10px] font-bold border border-border btn-press inline-flex items-center justify-center gap-1"
                      >
                        <Edit3 size={10} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(p.id)}
                        className="flex-1 bg-danger-light text-danger py-1.5 rounded-lg text-[10px] font-bold btn-press inline-flex items-center justify-center gap-1"
                      >
                        <Trash2 size={10} />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── SETTINGS VIEW ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-5 animate-slide-up">
            <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
              <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Alamat Toko
              </h3>
              <p className="text-[10px] text-text-tertiary leading-relaxed">
                Alamat ini akan muncul di halaman checkout saat pelanggan memilih &quot;Pickup&quot;.
              </p>
              <FormField
                label="Alamat Lengkap Toko"
                type="textarea"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Jl. Contoh No. 123, RT 01/RW 02, Kelurahan, Kota"
                rows={3}
              />
            </div>

            <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
              <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                Nomor WhatsApp Toko
              </h3>
              <p className="text-[10px] text-text-tertiary leading-relaxed">
                Pesanan akan dikirim ke nomor WhatsApp ini. Format: 628xxxxxxxxxx (tanpa +).
              </p>
              <FormField
                label="No. WhatsApp"
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="628123456789"
              />
            </div>

            {/* QRIS & Bank Account */}
            <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
              <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
                <ScanLine size={16} className="text-primary" />
                QRIS & Rekening Transfer
              </h3>
              <p className="text-[10px] text-text-tertiary leading-relaxed">
                Gambar QRIS & nomor rekening ini ditampilkan saat pelanggan pilih Transfer/QRIS. Biaya admin Rp 1.500 otomatis ditambahkan.
              </p>

              {/* QRIS Image Upload */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
                  Gambar QRIS
                </label>
                {qrisUrl && (
                  <img src={qrisUrl} alt="QRIS" className="w-32 h-32 object-contain mx-auto mb-3 rounded-xl border border-border bg-surface-alt" />
                )}
                <label className="flex items-center justify-center gap-2 bg-surface-alt text-text py-3 rounded-xl font-bold text-sm cursor-pointer btn-press border border-border">
                  <Upload size={16} className="text-text-secondary" />
                  {qrisImage ? qrisImage.name : 'Upload Gambar QRIS'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrisImage(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Bank Account */}
              <FormField
                label="Nama Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="BCA / Mandiri / BNI / dll"
              />
              <FormField
                label="Nomor Rekening"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg btn-press flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Simpan Pengaturan
            </button>
          </div>
        )}
      </div>

      {/* ─── MENU MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-extrabold text-text">
                {form.id ? 'Edit Menu' : 'Menu Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center text-text-secondary btn-press"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="flex flex-col gap-4">
              <FormField
                label="Nama Menu"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Kopi Susu J-Corners"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
                    Kategori
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text"
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <FormField
                  label="Harga (Rp)"
                  value={form.price}
                  onChange={(e) => updateForm('price', fmtPrice(e.target.value))}
                  placeholder="25.000"
                  required
                />
              </div>

              <FormField
                label="Deskripsi Singkat"
                type="textarea"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Deskripsi menu..."
                rows={3}
              />

              {/* Simple file upload button */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
                  Foto Menu
                </label>
                <label className="flex items-center justify-center gap-2 bg-surface-alt text-text py-3 rounded-xl font-bold text-sm cursor-pointer btn-press border border-border">
                  <Upload size={16} className="text-text-secondary" />
                  {form.image ? form.image.name : 'Pilih Foto Menu'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateForm('image', e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Availability Toggle */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
                  Ketersediaan
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm('available', true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 btn-press border ${
                      form.available
                        ? 'bg-success text-white border-success'
                        : 'bg-surface-alt text-text-tertiary border-border'
                    }`}
                  >
                    ✓ Tersedia
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm('available', false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 btn-press border ${
                      !form.available
                        ? 'bg-danger text-white border-danger'
                        : 'bg-surface-alt text-text-tertiary border-border'
                    }`}
                  >
                    ✗ Habis
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg mt-2 btn-press flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Menu'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}