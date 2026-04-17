'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShoppingBag } from '@/components/icons'

/**
 * Reusable sticky page header.
 * @param {string} title - Page title
 * @param {boolean} showBack - Show back button (default: true)
 * @param {boolean} showCart - Show cart icon with badge
 * @param {number} cartCount - Cart item count for badge
 * @param {React.ReactNode} rightAction - Custom right action slot
 * @param {function} onBack - Custom back handler
 */
export default function PageHeader({
  title,
  showBack = true,
  showCart = false,
  cartCount = 0,
  rightAction,
  onBack,
}) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) return onBack()
    router.back()
  }

  return (
    <header className="sticky top-0 z-50 glass px-5 py-4 flex items-center justify-between border-b border-border animate-slide-down">
      {showBack ? (
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press"
          aria-label="Kembali"
        >
          <ChevronLeft size={18} className="text-text" />
        </button>
      ) : (
        <div className="w-10" />
      )}

      <h1 className="text-[15px] font-bold text-text tracking-tight">
        {title}
      </h1>

      {showCart ? (
        <Link
          href="/cart"
          className="relative w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press"
          aria-label="Keranjang"
        >
          <ShoppingBag size={18} className="text-text" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 gradient-primary text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md animate-scale-in">
              {cartCount}
            </span>
          )}
        </Link>
      ) : rightAction ? (
        rightAction
      ) : (
        <div className="w-10" />
      )}
    </header>
  )
}
