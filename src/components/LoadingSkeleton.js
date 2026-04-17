'use client'

/**
 * Skeleton block with shimmer animation.
 * @param {string} className - Additional classes for sizing
 */
function Bone({ className = '' }) {
  return <div className={`animate-shimmer rounded-2xl ${className}`} />
}

/**
 * Grid skeleton for product cards.
 * @param {number} count - Number of skeleton cards
 */
export function GridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-3xl p-3 border border-border">
          <Bone className="w-full h-32 mb-3" />
          <Bone className="w-3/4 h-3 mb-2" />
          <Bone className="w-1/2 h-4" />
        </div>
      ))}
    </div>
  )
}

/**
 * List skeleton for order-like items.
 * @param {number} count - Number of skeleton rows
 */
export function ListSkeleton({ count = 2 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-3xl p-6 border border-border">
          <Bone className="w-1/2 h-4 mb-3" />
          <Bone className="w-3/4 h-3 mb-2" />
          <Bone className="w-1/3 h-3" />
        </div>
      ))}
    </div>
  )
}

/**
 * Full-page centered loading spinner.
 */
export function PageLoader() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-[3px] border-surface-alt border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-semibold text-text-secondary animate-pulse">Memuat...</p>
    </div>
  )
}
