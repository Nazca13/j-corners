'use client'

import { Plus } from '@/components/icons'

/**
 * Premium product card with hover effects and smooth UI.
 * @param {object} product - Product data from Supabase
 * @param {function} onAdd - Add to cart handler
 */
export default function ProductCard({ product, onAdd }) {
  const isSoldOut = product.available === false

  return (
    <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden card-hover flex flex-col animate-slide-up">
      {/* Image */}
      <div className="relative h-36 bg-surface-alt w-full overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75'}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isSoldOut ? 'grayscale opacity-50' : ''
          }`}
        />

        {/* Category Tag */}
        {product.category && (
          <div className="absolute top-3 left-3 glass px-3 py-1 rounded-full shadow-sm">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
              {product.category}
            </span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute top-3 right-3 bg-danger text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-md">
            HABIS
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-text line-clamp-1">{product.name}</h3>
        <p className="text-[10px] text-text-secondary mt-1 line-clamp-2 leading-relaxed flex-1">
          {product.description || 'Spesial J-Corners'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-extrabold text-primary">
            Rp {product.price?.toLocaleString('id-ID')}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); onAdd(product) }}
            disabled={isSoldOut}
            className="gradient-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md shadow-primary-glow btn-press disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Tambah ${product.name}`}
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}