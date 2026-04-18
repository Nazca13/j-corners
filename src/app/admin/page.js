'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLS, setLS } from '@/lib/storage'
import StatusBadge from '@/components/StatusBadge'
import FormField from '@/components/FormField'
import { PageLoader } from '@/components/LoadingSkeleton'
import {
  RefreshCw, LogOut, ClipboardList, Store, Plus, X,
  MapPin, CreditCard, Link2, Edit3, Trash2, Loader2,
  Package, CheckCircle2, Truck as TruckIcon, Clock, Upload, ScanLine,
  BarChart3, Download, FileText, Tag, MenuIcon, Eye,
  Calendar, TrendingUp, Star, Settings, Gift, Printer,
} from '@/components/icons'

/* ─── Chart.js ─── */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Filler)

/* ─── Constants ─── */
const STATUS_FLOW = ['Menunggu', 'Diproses', 'Diantar', 'Selesai']
const CATEGORIES = ['Food', 'Bakery', 'Coffee', 'Non Coffee']

const INITIAL_FORM = {
  id: null, name: '', category: 'Food', price: '', description: '',
  image: null, existing_image: '', available: true,
}

const PROMO_INIT = {
  id: null, code: '', discount_percent: '', discount_amount: '',
  min_order: '', max_usage: '100', valid_until: '',
}

/* ─── Helpers ─── */
const fmtPrice = (v) => {
  const num = String(v).replace(/\D/g, '')
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
const parsePrice = (v) => parseInt(String(v).replace(/\./g, ''), 10) || 0
const fmtRp = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

/* ─── Sidebar Items ─── */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'orders', label: 'Pesanan', icon: ClipboardList },
  { key: 'menu', label: 'Menu', icon: Store },
  { key: 'promo', label: 'Promo', icon: Tag },
  { key: 'reports', label: 'Laporan', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
]

/* ═══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Data */
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [promos, setPromos] = useState([])
  const [reviews, setReviews] = useState([])
  const [updatingId, setUpdatingId] = useState(null)

  /* Menu Modal */
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  /* Promo Modal */
  const [promoModal, setPromoModal] = useState(false)
  const [promoForm, setPromoForm] = useState(PROMO_INIT)

  /* Proof popup */
  const [proofUrl, setProofUrl] = useState(null)

  /* Menu filter */
  const [menuFilter, setMenuFilter] = useState('Semua')

  /* Settings */
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [qrisImage, setQrisImage] = useState(null)
  const [qrisUrl, setQrisUrl] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)

  /* Report filters */
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  /* ─── Auth & Fetch ─── */
  const fetchAll = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const [o, p, pr, r] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    ])

    setOrders(o.data || [])
    setProducts(p.data || [])
    setPromos(pr.data || [])
    setReviews(r.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    setStoreAddress(getLS('store_address', 'Jl. Telekomunikasi No. 1, Sukapura, Dayeuhkolot, Bandung, Jawa Barat 40257'))
    setStorePhone(getLS('store_phone', '628123456789'))
    setQrisUrl(getLS('store_qris_url', ''))
    setBankAccount(getLS('store_bank_account', ''))
    setBankName(getLS('store_bank_name', ''))
  }, [router])

  /* ─── Stats (revenue = Selesai only) ─── */
  const completedOrders = orders.filter((o) => o.status === 'Selesai')
  const revenue = completedOrders.reduce((sum, o) => sum + (o.total_harga || 0), 0)
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
  const todayRevenue = todayOrders.filter((o) => o.status === 'Selesai').reduce((s, o) => s + (o.total_harga || 0), 0)
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'Menunggu').length,
    processing: orders.filter((o) => o.status === 'Diproses').length,
    delivering: orders.filter((o) => o.status === 'Diantar').length,
    completed: completedOrders.length,
    revenue,
    menuCount: products.length,
  }

  /* ─── Revenue Chart Data (7 days) ─── */
  const chartData = (() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }
    const labels = days.map((d) => d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }))
    const data = days.map((d) => {
      const ds = d.toDateString()
      return completedOrders
        .filter((o) => new Date(o.created_at).toDateString() === ds)
        .reduce((s, o) => s + (o.total_harga || 0), 0)
    })
    return {
      labels,
      datasets: [{
        label: 'Pendapatan',
        data,
        borderColor: '#7A1B1B',
        backgroundColor: 'rgba(122, 27, 27, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7A1B1B',
        pointRadius: 4,
      }],
    }
  })()

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmtRp(ctx.parsed.y) } } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => v >= 1000 ? `${v / 1000}k` : v } },
      x: { grid: { display: false } },
    },
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
        id: product.id, name: product.name, category: product.category,
        price: fmtPrice(product.price), description: product.description || '',
        image: null, existing_image: product.image_url || '', available: product.available !== false,
      })
    } else {
      setForm(INITIAL_FORM)
    }
    setModalOpen(true)
  }

  const handleSaveMenu = async (e) => {
    e.preventDefault()
    setSaving(true)
    let imageUrl = form.existing_image

    if (form.image) {
      const ext = form.image.name.split('.').pop()
      const fname = `menu_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(fname, form.image)
      if (!error) imageUrl = supabase.storage.from('product-images').getPublicUrl(fname).data.publicUrl
    }

    const payload = {
      name: form.name, category: form.category, price: parsePrice(form.price),
      description: form.description, image_url: imageUrl, available: form.available,
    }

    if (form.id) {
      await supabase.from('products').update(payload).eq('id', form.id)
    } else {
      await supabase.from('products').insert([payload])
    }

    setSaving(false)
    setModalOpen(false)
    fetchAll()
  }

  const handleDeleteMenu = async (id) => {
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  /* ─── Promo Actions ─── */
  const openPromoModal = (promo = null) => {
    if (promo) {
      setPromoForm({
        id: promo.id, code: promo.code,
        discount_percent: promo.discount_percent || '',
        discount_amount: promo.discount_amount ? fmtPrice(promo.discount_amount) : '',
        min_order: promo.min_order ? fmtPrice(promo.min_order) : '',
        max_usage: String(promo.max_usage || 100),
        valid_until: promo.valid_until ? promo.valid_until.slice(0, 10) : '',
      })
    } else {
      setPromoForm(PROMO_INIT)
    }
    setPromoModal(true)
  }

  const handleSavePromo = async (e) => {
    e.preventDefault()
    const payload = {
      code: promoForm.code.toUpperCase(),
      discount_percent: parseInt(promoForm.discount_percent) || 0,
      discount_amount: parsePrice(promoForm.discount_amount),
      min_order: parsePrice(promoForm.min_order),
      max_usage: parseInt(promoForm.max_usage) || 100,
      valid_until: promoForm.valid_until || null,
      is_active: true,
    }

    if (promoForm.id) {
      await supabase.from('promo_codes').update(payload).eq('id', promoForm.id)
    } else {
      await supabase.from('promo_codes').insert([payload])
    }
    setPromoModal(false)
    fetchAll()
  }

  const togglePromo = async (id, active) => {
    await supabase.from('promo_codes').update({ is_active: !active }).eq('id', id)
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !active } : p)))
  }

  const deletePromo = async (id) => {
    await supabase.from('promo_codes').delete().eq('id', id)
    setPromos((prev) => prev.filter((p) => p.id !== id))
  }

  /* ─── Settings ─── */
  const handleSaveSettings = async () => {
    setLS('store_address', storeAddress)
    setLS('store_phone', storePhone)
    setLS('store_bank_account', bankAccount)
    setLS('store_bank_name', bankName)

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

  /* ─── Export ─── */
  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.created_at)
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return m === reportMonth
  })

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default || await import('xlsx')
    const rows = filteredOrders.map((o) => ({
      ID: o.id?.slice(0, 8).toUpperCase(),
      Pelanggan: o.nama_pelanggan || o.nama || '-',
      Status: o.status,
      Total: o.total_harga || 0,
      Metode: o.metode_bayar || '-',
      Tanggal: fmtDate(o.created_at),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    XLSX.writeFile(wb, `laporan_jcorners_${reportMonth}.xlsx`)
  }

  const exportPrint = () => window.print()

  /* ─── Loading ─── */
  if (loading) return <PageLoader />

  return (
    <>
      {/* ═══ Sidebar Overlay (mobile) ═══ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══ Sidebar ═══ */}
      <aside className={`fixed top-0 left-0 z-[999] h-full w-64 bg-surface border-r border-border shadow-2xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div>
            <h1 className="text-base font-extrabold text-text leading-none">Dapur J-Corners</h1>
            <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest mt-0.5">Panel Owner</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center btn-press">
            <X size={14} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 btn-press ${
                activeTab === key ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-alt'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-danger bg-danger-light btn-press">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className="min-h-screen bg-bg lg:ml-64 pb-12">
        {/* Toast */}
        {settingsSaved && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-success text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-xl animate-slide-down flex items-center gap-2">
            <CheckCircle2 size={16} /> Pengaturan tersimpan!
          </div>
        )}

        {/* Mobile Header */}
        <header className="lg:hidden bg-surface px-5 py-4 sticky top-0 z-40 shadow-sm border-b border-border flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center btn-press">
            <MenuIcon size={18} />
          </button>
          <h1 className="text-sm font-extrabold text-text">
            {NAV_ITEMS.find((n) => n.key === activeTab)?.label || 'Admin'}
          </h1>
          <button onClick={fetchAll} className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center text-primary btn-press">
            <RefreshCw size={18} />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-surface px-8 py-4 sticky top-0 z-40 shadow-sm border-b border-border items-center justify-between">
          <h1 className="text-lg font-extrabold text-text">
            {NAV_ITEMS.find((n) => n.key === activeTab)?.label || 'Admin'}
          </h1>
          <button onClick={fetchAll} className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center text-primary btn-press">
            <RefreshCw size={18} />
          </button>
        </header>

        <div className="p-4 lg:p-6 max-w-[1200px]">
          {/* ═══════════ DASHBOARD ═══════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5 animate-slide-up">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Pesanan Hari Ini', value: todayOrders.length, icon: Package, color: 'text-primary', bg: 'bg-primary-light' },
                  { label: 'Revenue Hari Ini', value: fmtRp(todayRevenue), icon: TrendingUp, color: 'text-success', bg: 'bg-success-light' },
                  { label: 'Total Menu', value: stats.menuCount, icon: Store, color: 'text-primary', bg: 'bg-primary-light' },
                  { label: 'Rating Rata-rata', value: `⭐ ${avgRating}`, icon: Star, color: 'text-accent', bg: 'bg-accent-light' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-2xl p-4 border border-border overflow-hidden`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon size={14} className={`${color} shrink-0`} />
                      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider truncate">{label}</span>
                    </div>
                    <p className={`text-base lg:text-lg font-extrabold ${color} truncate`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className="bg-surface rounded-3xl p-4 lg:p-6 border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
                    <BarChart3 size={16} className="text-primary shrink-0" />
                    <span>Pendapatan 7 Hari</span>
                  </h3>
                  <span className="text-xs font-bold text-success bg-success-light px-3 py-1 rounded-full w-fit">{fmtRp(revenue)} total</span>
                </div>
                <div className="h-52 lg:h-72">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Order Status Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'text-primary', bg: 'bg-primary-light' },
                  { label: 'Diproses', value: stats.processing, icon: Package, color: 'text-primary', bg: 'bg-primary-light' },
                  { label: 'Diantar', value: stats.delivering, icon: TruckIcon, color: 'text-primary', bg: 'bg-primary-light' },
                  { label: 'Selesai', value: stats.completed, icon: CheckCircle2, color: 'text-success', bg: 'bg-success-light' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-2xl p-3 text-center border border-border`}>
                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                    <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Reviews */}
              {reviews.length > 0 && (
                <div className="bg-surface rounded-3xl p-4 lg:p-6 border border-border shadow-sm">
                  <h3 className="text-sm font-extrabold text-text mb-3 flex items-center gap-2">
                    <Star size={16} className="text-accent" />
                    Review Terbaru
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {reviews.slice(0, 6).map((r) => (
                      <div key={r.id} className="flex items-start gap-3 bg-surface-alt p-3 rounded-xl border border-border">
                        <div className="shrink-0 text-accent text-xs font-bold">
                          {'⭐'.repeat(r.rating)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text font-medium truncate">{r.comment || 'Tidak ada komentar'}</p>
                          <p className="text-[9px] text-text-tertiary mt-0.5">{fmtDate(r.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ ORDERS ═══════════ */}
          {activeTab === 'orders' && (
            <div className="space-y-3 stagger-children animate-slide-up">
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardList size={48} className="text-text-tertiary mx-auto mb-4" strokeWidth={1} />
                  <p className="text-sm text-text-secondary font-bold">Belum ada pesanan</p>
                </div>
              ) : (
                orders.map((order) => {
                  const isUpdating = updatingId === order.id
                  return (
                    <div key={order.id} className="bg-surface rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-text-tertiary font-mono">#{order.id?.slice(0, 8).toUpperCase()}</p>
                          <p className="text-sm font-bold text-text truncate">{order.nama_pelanggan || order.nama || 'Pelanggan'}</p>
                          <p className="text-[10px] text-text-tertiary">{fmtDate(order.created_at)} • {fmtTime(order.created_at)}</p>
                          {order.no_hp && <p className="text-[10px] text-text-secondary">HP: {order.no_hp}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-extrabold text-primary">{fmtRp(order.total_harga)}</p>
                          <div className="mt-2"><StatusBadge status={order.status} /></div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {order.alamat && (
                          <span className="text-[10px] text-text-secondary bg-surface-alt px-2 py-1 rounded-lg border border-border inline-flex items-center gap-1">
                            <MapPin size={10} className="text-text-tertiary shrink-0" />
                            <span className="truncate max-w-[150px]">{order.alamat}</span>
                          </span>
                        )}
                        <span className="text-[10px] text-text-secondary bg-surface-alt px-2 py-1 rounded-lg border border-border inline-flex items-center gap-1">
                          <CreditCard size={10} className="text-text-tertiary" />
                          {order.metode_bayar === 'qris' ? 'QRIS/Transfer' : 'Cash'}
                        </span>
                      </div>

                      {/* Items */}
                      {order.items?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {order.items.map((item, i) => (
                            <span key={i} className="bg-primary-light text-text text-[9px] font-bold px-2 py-1 rounded-lg">
                              {item.name} <span className="text-primary">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Proof — popup instead of new tab */}
                      {order.bukti_transfer && (
                        <button
                          onClick={() => setProofUrl(order.bukti_transfer)}
                          className="inline-flex items-center gap-1.5 mb-3 bg-primary-light text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg border border-primary/10 btn-press"
                        >
                          <Eye size={11} />
                          Lihat Bukti Transfer
                        </button>
                      )}

                      {/* Status Update */}
                      <div className="pt-3 border-t border-dashed border-border">
                        <p className="text-[9px] font-bold text-text-tertiary mb-2 uppercase tracking-widest">Update Status</p>
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

          {/* ═══════════ MENU ═══════════ */}
          {activeTab === 'menu' && (
            <div className="animate-slide-up">
              <button
                onClick={() => openModal()}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg mb-6 flex justify-center items-center gap-2 btn-press"
              >
                <Plus size={18} strokeWidth={2.5} /> Tambah Menu Baru
              </button>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
                {['Semua', ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMenuFilter(cat)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 btn-press border ${
                      menuFilter === cat
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface-alt text-text-secondary border-border'
                    }`}
                  >
                    {cat} ({cat === 'Semua' ? products.length : products.filter(p => p.category === cat).length})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-children">
                {products.filter(p => menuFilter === 'Semua' || p.category === menuFilter).map((p) => (
                  <div key={p.id} className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col relative animate-slide-up">
                    {p.available === false && (
                      <div className="absolute top-2 left-2 bg-danger text-white text-[8px] font-bold px-2 py-1 rounded-md z-10">HABIS</div>
                    )}
                    <div className={`h-24 lg:h-32 bg-surface-alt relative ${p.available === false ? 'grayscale opacity-50' : ''}`}>
                      <img src={p.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75'} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="text-xs font-bold text-text line-clamp-1">{p.name}</h3>
                      <p className="text-[9px] text-text-tertiary mt-0.5">{p.category}</p>
                      <p className="text-sm font-extrabold text-primary mt-1 mb-3">{fmtRp(p.price)}</p>
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => openModal(p)} className="flex-1 bg-surface-alt text-text py-1.5 rounded-lg text-[10px] font-bold border border-border btn-press inline-flex items-center justify-center gap-1">
                          <Edit3 size={10} /> Edit
                        </button>
                        <button onClick={() => handleDeleteMenu(p.id)} className="flex-1 bg-danger-light text-danger py-1.5 rounded-lg text-[10px] font-bold btn-press inline-flex items-center justify-center gap-1">
                          <Trash2 size={10} /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ PROMO ═══════════ */}
          {activeTab === 'promo' && (
            <div className="animate-slide-up">
              <button
                onClick={() => openPromoModal()}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg mb-6 flex justify-center items-center gap-2 btn-press"
              >
                <Plus size={18} strokeWidth={2.5} /> Buat Kode Promo
              </button>

              {promos.length === 0 ? (
                <div className="text-center py-16">
                  <Gift size={48} className="text-text-tertiary mx-auto mb-4" strokeWidth={1} />
                  <p className="text-sm text-text-secondary font-bold">Belum ada kode promo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promos.map((p) => (
                    <div key={p.id} className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary text-white text-xs font-extrabold px-3 py-1 rounded-full">{p.code}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-success-light text-success' : 'bg-surface-alt text-text-tertiary'}`}>
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openPromoModal(p)} className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center btn-press"><Edit3 size={12} /></button>
                          <button onClick={() => togglePromo(p.id, p.is_active)} className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center btn-press text-text-secondary">
                            {p.is_active ? <X size={12} /> : <CheckCircle2 size={12} />}
                          </button>
                          <button onClick={() => deletePromo(p.id)} className="w-7 h-7 rounded-lg bg-danger-light flex items-center justify-center btn-press text-danger"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-text-secondary">
                        {p.discount_percent > 0 && <span className="bg-surface-alt px-2 py-1 rounded-lg border border-border font-bold">Diskon {p.discount_percent}%</span>}
                        {p.discount_amount > 0 && <span className="bg-surface-alt px-2 py-1 rounded-lg border border-border font-bold">Potongan {fmtRp(p.discount_amount)}</span>}
                        {p.min_order > 0 && <span className="bg-surface-alt px-2 py-1 rounded-lg border border-border">Min. {fmtRp(p.min_order)}</span>}
                        <span className="bg-surface-alt px-2 py-1 rounded-lg border border-border">Terpakai: {p.usage_count || 0}/{p.max_usage}</span>
                        {p.valid_until && <span className="bg-surface-alt px-2 py-1 rounded-lg border border-border">s/d {fmtDate(p.valid_until)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ REPORTS ═══════════ */}
          {activeTab === 'reports' && (
            <div className="animate-slide-up space-y-5">
              {/* Filter */}
              <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
                <h3 className="text-sm font-extrabold text-text mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" /> Filter Laporan
                </h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Bulan</label>
                    <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text" />
                  </div>
                  <button onClick={exportExcel} className="px-4 py-3 bg-success text-white rounded-xl text-xs font-bold btn-press flex items-center gap-1.5">
                    <Download size={14} /> Excel
                  </button>
                  <button onClick={exportPrint} className="px-4 py-3 bg-primary text-white rounded-xl text-xs font-bold btn-press flex items-center gap-1.5">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-surface rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Total Pesanan</p>
                  <p className="text-2xl font-extrabold text-text">{filteredOrders.length}</p>
                </div>
                <div className="bg-surface rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Pendapatan</p>
                  <p className="text-2xl font-extrabold text-success">{fmtRp(filteredOrders.filter(o => o.status === 'Selesai').reduce((s, o) => s + (o.total_harga || 0), 0))}</p>
                </div>
                <div className="bg-surface rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Selesai</p>
                  <p className="text-2xl font-extrabold text-text">{filteredOrders.filter(o => o.status === 'Selesai').length}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-alt border-b border-border">
                        <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-widest text-[9px]">ID</th>
                        <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-widest text-[9px]">Pelanggan</th>
                        <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-widest text-[9px]">Status</th>
                        <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-widest text-[9px]">Total</th>
                        <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-widest text-[9px]">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50">
                          <td className="px-4 py-3 font-mono text-text-secondary">#{o.id?.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-medium text-text">{o.nama_pelanggan || o.nama || '-'}</td>
                          <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-3 text-right font-bold text-primary">{fmtRp(o.total_harga)}</td>
                          <td className="px-4 py-3 text-text-secondary">{fmtDate(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ SETTINGS ═══════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-5 animate-slide-up max-w-2xl">
              <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-text flex items-center gap-2"><MapPin size={16} className="text-primary" /> Alamat Toko</h3>
                <FormField label="Alamat Lengkap Toko" type="textarea" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="Jl. ..." rows={3} />
              </div>
              <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-text flex items-center gap-2"><CreditCard size={16} className="text-primary" /> WhatsApp Toko</h3>
                <FormField label="No. WhatsApp" type="tel" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="628123456789" />
              </div>
              <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-text flex items-center gap-2"><ScanLine size={16} className="text-primary" /> QRIS & Rekening</h3>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Gambar QRIS</label>
                  {qrisUrl && <img src={qrisUrl} alt="QRIS" className="w-32 h-32 object-contain mx-auto mb-3 rounded-xl border border-border bg-surface-alt" />}
                  <label className="flex items-center justify-center gap-2 bg-surface-alt text-text py-3 rounded-xl font-bold text-sm cursor-pointer btn-press border border-border">
                    <Upload size={16} className="text-text-secondary" />
                    {qrisImage ? qrisImage.name : 'Upload Gambar QRIS'}
                    <input type="file" accept="image/*" onChange={(e) => setQrisImage(e.target.files[0])} className="hidden" />
                  </label>
                </div>
                <FormField label="Nama Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA / Mandiri / BNI" />
                <FormField label="Nomor Rekening" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1234567890" />
              </div>
              <button onClick={handleSaveSettings} className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg btn-press flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Simpan Pengaturan
              </button>
            </div>
          )}
        </div>

        {/* ═══ Proof Popup ═══ */}
        {proofUrl && (
          <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setProofUrl(null)}>
            <div className="bg-surface rounded-3xl p-4 max-w-md w-full max-h-[90vh] overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-extrabold text-text">Bukti Transfer</h3>
                <button onClick={() => setProofUrl(null)} className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center btn-press"><X size={14} /></button>
              </div>
              <img src={proofUrl} alt="Bukti Transfer" className="w-full rounded-2xl object-contain max-h-[70vh]" />
            </div>
          </div>
        )}

        {/* ═══ Menu Modal ═══ */}
        {modalOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-extrabold text-text">{form.id ? 'Edit Menu' : 'Menu Baru'}</h2>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center btn-press"><X size={16} /></button>
              </div>
              <form onSubmit={handleSaveMenu} className="flex flex-col gap-4">
                <FormField label="Nama Menu" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Kopi Susu J-Corners" required />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Kategori</label>
                    <select className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text" value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <FormField label="Harga (Rp)" value={form.price} onChange={(e) => updateForm('price', fmtPrice(e.target.value))} placeholder="25.000" required />
                </div>
                <FormField label="Deskripsi" type="textarea" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Deskripsi menu..." rows={3} />
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Foto Menu</label>
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 btn-press ${
                      form.image ? 'border-primary bg-primary-light' : 'border-border bg-surface-alt hover:border-primary/40'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary-light') }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary-light') }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-primary', 'bg-primary-light')
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith('image/')) updateForm('image', file)
                    }}
                    onClick={() => document.getElementById('menu-image-input')?.click()}
                  >
                    {form.image ? (
                      <div className="space-y-2">
                        <img src={URL.createObjectURL(form.image)} alt="Preview" className="w-20 h-20 mx-auto rounded-xl object-cover" />
                        <p className="text-xs font-bold text-primary truncate">{form.image.name}</p>
                      </div>
                    ) : form.existing_image ? (
                      <div className="space-y-2">
                        <img src={form.existing_image} alt="Current" className="w-20 h-20 mx-auto rounded-xl object-cover opacity-60" />
                        <p className="text-[10px] text-text-tertiary">Drop gambar baru / klik untuk ganti</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-text-tertiary mx-auto mb-2" />
                        <p className="text-xs font-bold text-text-secondary">Drop gambar di sini</p>
                        <p className="text-[10px] text-text-tertiary">atau klik untuk pilih file</p>
                      </>
                    )}
                    <input id="menu-image-input" type="file" accept="image/*" onChange={(e) => updateForm('image', e.target.files[0])} className="hidden" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Ketersediaan</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateForm('available', true)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold btn-press border ${form.available ? 'bg-success text-white border-success' : 'bg-surface-alt text-text-tertiary border-border'}`}>✓ Tersedia</button>
                    <button type="button" onClick={() => updateForm('available', false)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold btn-press border ${!form.available ? 'bg-danger text-white border-danger' : 'bg-surface-alt text-text-tertiary border-border'}`}>✗ Habis</button>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg mt-2 btn-press flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Menu'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ Promo Modal ═══ */}
        {promoModal && (
          <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-extrabold text-text">{promoForm.id ? 'Edit Promo' : 'Promo Baru'}</h2>
                <button onClick={() => setPromoModal(false)} className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center btn-press"><X size={16} /></button>
              </div>
              <form onSubmit={handleSavePromo} className="flex flex-col gap-4">
                <FormField label="Kode Promo" value={promoForm.code} onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="JUMATBERKAH" required />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Diskon (%)" value={promoForm.discount_percent} onChange={(e) => setPromoForm((p) => ({ ...p, discount_percent: e.target.value }))} placeholder="10" />
                  <FormField label="Potongan (Rp)" value={promoForm.discount_amount} onChange={(e) => setPromoForm((p) => ({ ...p, discount_amount: fmtPrice(e.target.value) }))} placeholder="5.000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Min. Order (Rp)" value={promoForm.min_order} onChange={(e) => setPromoForm((p) => ({ ...p, min_order: fmtPrice(e.target.value) }))} placeholder="25.000" />
                  <FormField label="Max Penggunaan" value={promoForm.max_usage} onChange={(e) => setPromoForm((p) => ({ ...p, max_usage: e.target.value }))} placeholder="100" />
                </div>
                <FormField label="Berlaku Sampai" type="date" value={promoForm.valid_until} onChange={(e) => setPromoForm((p) => ({ ...p, valid_until: e.target.value }))} />
                <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg mt-2 btn-press">Simpan Promo</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  )
}