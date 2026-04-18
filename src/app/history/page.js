'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import { ListSkeleton } from '@/components/LoadingSkeleton'
import { ClipboardList, Star, X, RefreshCw } from '@/components/icons'
import { getLSJSON, setLSJSON } from '@/lib/storage'

/* ─── Order Timeline Steps ─── */
const STEPS = [
  { key: 'Menunggu', label: 'Pesanan Diterima', desc: 'Menunggu konfirmasi admin' },
  { key: 'Diproses', label: 'Sedang Disiapkan', desc: 'Dapur sedang menyiapkan pesananmu' },
  { key: 'Diantar', label: 'Dalam Pengiriman', desc: 'Kurir sedang menuju lokasimu / Siap diambil' },
  { key: 'Selesai', label: 'Selesai', desc: 'Selamat menikmati!' },
]

const STATUS_INDEX = { Menunggu: 0, Diproses: 1, Diantar: 2, Selesai: 3 }

export default function HistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  /* Review state */
  const [reviewOrder, setReviewOrder] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewedIds, setReviewedIds] = useState([])
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchOrders = async () => {
    const myOrders = getLSJSON('my_orders', [])

    if (myOrders.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('id', myOrders)
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    setReviewedIds(getLSJSON('reviewed_orders', []))

    /* ─── Supabase Realtime: listen for order status changes ─── */
    const myOrders = getLSJSON('my_orders', [])
    if (myOrders.length === 0) return

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new
          if (myOrders.includes(updated.id)) {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  /* ─── Submit Review ─── */
  const submitReview = async () => {
    if (!reviewOrder) return
    setSubmittingReview(true)

    await supabase.from('reviews').insert([{
      order_id: reviewOrder.id,
      rating: reviewRating,
      comment: reviewComment,
    }])

    const newReviewed = [...reviewedIds, reviewOrder.id]
    setReviewedIds(newReviewed)
    setLSJSON('reviewed_orders', newReviewed)
    setReviewOrder(null)
    setReviewRating(5)
    setReviewComment('')
    setSubmittingReview(false)
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      <PageHeader
        title="Riwayat Pesanan"
        onBack={() => router.push('/')}
        rightAction={
          <button
            onClick={fetchOrders}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className="text-primary" />
          </button>
        }
      />

      {/* Realtime indicator */}
      <div className="px-5 pt-3">
        <div className="flex items-center gap-2 text-[10px] text-success font-bold">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Live — status otomatis update
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <ListSkeleton count={2} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada pesanan"
            description="Pesananmu akan tampil di sini"
            actionLabel="Pesan Sekarang"
            actionHref="/menu"
          />
        ) : (
          <div className="space-y-4 stagger-children">
            {orders.map((order) => {
              const currentStep = STATUS_INDEX[order.status] ?? 0
              const isComplete = order.status === 'Selesai'
              const hasReviewed = reviewedIds.includes(order.id)

              return (
                <div
                  key={order.id}
                  className="bg-surface rounded-3xl p-6 shadow-sm border border-border animate-slide-up"
                >
                  {/* ─── Order Header ─── */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] text-text-tertiary font-mono mb-1">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xl font-extrabold text-text tracking-tight">
                        Rp {order.total_harga?.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* ─── Timeline ─── */}
                  <div className="relative pl-6 space-y-5 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-border">
                    {STEPS.map((step, index) => {
                      const isDone = index <= currentStep
                      const isActive = index === currentStep

                      return (
                        <div key={step.key} className="relative">
                          <div
                            className={`absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full border-[3px] transition-all duration-500 ${
                              isDone
                                ? 'bg-primary border-primary-light'
                                : 'bg-surface-alt border-surface'
                            } ${isActive ? 'ring-4 ring-primary-glow scale-110' : ''}`}
                          />
                          <h4 className={`text-sm font-bold transition-colors ${isDone ? 'text-text' : 'text-text-tertiary'}`}>
                            {step.label}
                          </h4>
                          <p className={`text-[10px] mt-0.5 ${isDone ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                            {step.desc}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* ─── Items Summary ─── */}
                  {order.items?.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-2">
                      {order.items.map((item, i) => (
                        <span
                          key={i}
                          className="bg-surface-alt text-text border border-border text-[10px] font-bold px-3 py-1.5 rounded-full"
                        >
                          {item.name}{' '}
                          <span className="text-primary ml-1">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ─── Review Button (only when complete & not reviewed) ─── */}
                  {isComplete && !hasReviewed && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="mt-4 w-full bg-accent text-white py-3 rounded-2xl font-bold text-sm btn-press flex items-center justify-center gap-2 shadow-md"
                    >
                      <Star size={16} />
                      Beri Rating & Review
                    </button>
                  )}
                  {isComplete && hasReviewed && (
                    <p className="mt-4 text-center text-[10px] text-success font-bold">✓ Sudah di-review, terima kasih!</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ Review Modal ═══ */}
      {reviewOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-text">Review Pesanan</h2>
              <button onClick={() => setReviewOrder(null)} className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center btn-press">
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-text-secondary mb-4">
              #{reviewOrder.id?.slice(0, 8).toUpperCase()} — Rp {reviewOrder.total_harga?.toLocaleString('id-ID')}
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-200 btn-press border-2 ${
                    s <= reviewRating ? 'bg-accent text-white border-accent scale-110' : 'bg-surface-alt text-text-tertiary border-border'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Komentar (opsional)..."
              rows={3}
              className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text resize-none mb-4"
            />

            <button
              onClick={submitReview}
              disabled={submittingReview}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg btn-press flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submittingReview ? 'Mengirim...' : 'Kirim Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}