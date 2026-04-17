'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import { ListSkeleton } from '@/components/LoadingSkeleton'
import { ClipboardList } from '@/components/icons'
import { getLSJSON } from '@/lib/storage'

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

  useEffect(() => {
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
    fetchOrders()
  }, [])

  return (
    <div className="min-h-screen bg-bg pb-32">
      <PageHeader title="Riwayat Pesanan" onBack={() => router.push('/')} />

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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}