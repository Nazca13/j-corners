'use client'

import Link from 'next/link'

/**
 * Reusable empty state component.
 * @param {React.ReactNode} icon - Lucide icon component
 * @param {string} title - Empty state heading
 * @param {string} description - Optional description text
 * @param {string} actionLabel - CTA button text
 * @param {string} actionHref - CTA button link
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center mb-5 shadow-sm animate-float">
        {Icon && <Icon size={36} className="text-text-tertiary" strokeWidth={1.5} />}
      </div>

      <h2 className="text-lg font-bold text-text mb-1">{title}</h2>

      {description && (
        <p className="text-sm text-text-secondary mb-6 max-w-[240px] leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="gradient-primary text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-primary-glow btn-press"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
