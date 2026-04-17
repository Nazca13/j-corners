'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getLSJSON, setLSJSON } from '@/lib/storage'
import { PageLoader } from '@/components/LoadingSkeleton'
import { ChevronLeft, ShoppingBag, Minus, Plus, MessageSquare, CheckCircle2 } from '@/components/icons'

export default function FoodDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(data)
    }
    fetchProduct()

    const cart = getLSJSON('cart', [])
    setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0))
  }, [id])

  const total = product ? product.price * qty : 0
  const isSoldOut = product?.available === false

  const addToCart = () => {
    if (isSoldOut) return

    const cart = getLSJSON('cart', [])
    const idx = cart.findIndex((i) => i.id === product.id)

    if (idx !== -1) {
      cart[idx].quantity += qty
      cart[idx].notes = notes
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: qty,
        notes,
      })
    }

    setLSJSON('cart', cart)
    setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0))

    /* Show toast, stay on page so user isn't confused */
    setAdded(true)
    setQty(1)
    setNotes('')
    setTimeout(() => setAdded(false), 2000)
  }

  if (!product) return <PageLoader />

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* ─── Added Toast ─── */}
      {added && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-success text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-xl animate-slide-down flex items-center gap-2">
          <CheckCircle2 size={16} />
          Ditambahkan ke keranjang!
        </div>
      )}

      {/* ─── Floating Header ─── */}
      <div className="absolute top-0 w-full max-w-md z-50 flex justify-between items-center p-5">
        <button
          onClick={() => router.back()}
          className="glass w-10 h-10 rounded-full flex items-center justify-center shadow-lg btn-press"
          aria-label="Kembali"
        >
          <ChevronLeft size={18} className="text-text" />
        </button>
        <Link
          href="/cart"
          className="relative glass w-10 h-10 rounded-full flex items-center justify-center shadow-lg btn-press"
          aria-label="Keranjang"
        >
          <ShoppingBag size={18} className="text-text" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* ─── Product Image ─── */}
      <div className="w-full h-80 bg-surface-alt relative overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&q=80'}
          className="w-full h-full object-cover animate-fade-in"
          alt={product.name}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/30 to-transparent" />
        {/* Curved bottom */}
        <div className="absolute bottom-0 w-full h-8 bg-bg rounded-t-[2rem] translate-y-1" />
      </div>

      {/* ─── Content ─── */}
      <div className="px-6 -mt-2 relative z-10 animate-slide-up">
        {/* Category label */}
        {product.category && (
          <span className="inline-block text-[10px] font-bold text-primary bg-primary-light px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            {product.category}
          </span>
        )}

        {/* Title & Price */}
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-2xl font-extrabold text-text leading-tight w-3/4">
            {product.name}
          </h1>
          <span className="text-xl font-extrabold text-primary whitespace-nowrap">
            Rp {product.price?.toLocaleString('id-ID')}
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-6">
          {product.description || 'Menu spesial dari J-Corners'}
        </p>

        {/* ─── Quantity ─── */}
        <div className="flex items-center justify-between bg-surface p-4 rounded-2xl shadow-sm border border-border mb-4">
          <span className="text-sm font-bold text-text">Jumlah Pesanan</span>
          <div className="flex items-center gap-3 bg-surface-alt rounded-xl p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-surface shadow-xs flex items-center justify-center btn-press"
              aria-label="Kurangi"
            >
              <Minus size={14} strokeWidth={2.5} className="text-text" />
            </button>
            <span className="font-bold w-5 text-center text-text">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-primary text-white shadow-sm flex items-center justify-center btn-press"
              aria-label="Tambah"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ─── Notes ─── */}
        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-border">
          <label className="flex items-center gap-2 text-xs font-bold text-text mb-2">
            <MessageSquare size={14} className="text-text-secondary" />
            Catatan (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Es dipisah, pedas..."
            className="w-full text-sm bg-surface-alt p-3 rounded-xl border border-border"
          />
        </div>
      </div>

      {/* ─── Fixed CTA ─── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent z-50">
        <button
          onClick={addToCart}
          disabled={isSoldOut || added}
          className={`w-full py-3.5 rounded-full font-bold text-white text-sm shadow-lg flex justify-between px-6 items-center btn-press transition-colors duration-200 ${
            isSoldOut ? 'bg-gray-400 cursor-not-allowed' : added ? 'bg-success' : 'bg-primary'
          }`}
        >
          <span>{isSoldOut ? 'Stok Habis' : added ? '✓ Ditambahkan!' : 'Tambah ke Keranjang'}</span>
          {!isSoldOut && !added && <span className="font-extrabold">Rp {total.toLocaleString('id-ID')}</span>}
        </button>
      </div>
    </div>
  )
}