'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import { GridSkeleton } from '@/components/LoadingSkeleton'
import { AlertTriangle, RefreshCw } from '@/components/icons'
import { getLSJSON } from '@/lib/storage'

const CATEGORIES = ['Food', 'Bakery', 'Coffee', 'Non Coffee']

function MenuContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeCat, setActiveCat] = useState(searchParams.get('cat') || 'Food')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const cart = getLSJSON('cart', [])
    setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0))

    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const refreshMenu = () => {
    setLoading(true)
    const cart = getLSJSON('cart', [])
    setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0))
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }

  const filtered = products.filter((p) => p.category === activeCat)

  return (
    <>
      <PageHeader
        title="Katalog Menu"
        showCart
        cartCount={cartCount}
        onBack={() => router.push('/')}
        rightAction={
          <div className="flex items-center gap-2">
            <button onClick={refreshMenu} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press" aria-label="Refresh">
              <RefreshCw size={16} className="text-primary" />
            </button>
          </div>
        }
      />

      {/* ─── Category Filter ─── */}
      <div className="px-5 py-4 sticky top-[73px] z-40 glass border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 btn-press ${
                activeCat === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface text-text-secondary border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      <div className="px-5 pb-32 pt-4">
        {loading ? (
          <GridSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Belum ada menu"
            description="Belum ada menu di kategori ini"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 stagger-children">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/menu/${item.id}`}
                className="bg-surface rounded-3xl p-3 shadow-sm border border-border flex flex-col card-hover animate-slide-up relative"
              >
                {/* Sold Out Badge */}
                {item.available === false && (
                  <div className="absolute top-4 left-4 bg-danger text-white text-[9px] font-bold px-2.5 py-1 rounded-lg z-10 shadow-sm">
                    HABIS
                  </div>
                )}

                {/* Image */}
                <div className={`w-full h-32 rounded-2xl bg-surface-alt overflow-hidden mb-3 ${
                  item.available === false ? 'grayscale opacity-50' : ''
                }`}>
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75'}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    alt={item.name}
                  />
                </div>

                {/* Info */}
                <h3 className="text-xs font-bold line-clamp-1 text-text">{item.name}</h3>
                <p className="text-[10px] text-text-secondary line-clamp-2 mt-1 flex-1 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-primary font-extrabold text-sm mt-3">
                  Rp {item.price?.toLocaleString('id-ID')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-surface-alt border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  )
}