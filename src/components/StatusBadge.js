'use client'

const STATUS_STYLES = {
  Menunggu: {
    bg: 'bg-primary-light',
    text: 'text-primary',
    border: 'border-primary-glow',
    dot: 'bg-primary',
    pulse: true,
  },
  Diproses: {
    bg: 'bg-accent-light',
    text: 'text-accent',
    border: 'border-accent',
    dot: 'bg-accent',
    pulse: false,
  },
  Diantar: {
    bg: 'bg-primary-light',
    text: 'text-primary-dark',
    border: 'border-primary-glow',
    dot: 'bg-primary-dark',
    pulse: false,
  },
  Selesai: {
    bg: 'bg-success-light',
    text: 'text-success',
    border: 'border-success',
    dot: 'bg-success',
    pulse: false,
  },
}

const FALLBACK = {
  bg: 'bg-surface-alt',
  text: 'text-text-secondary',
  border: 'border-border',
  dot: 'bg-text-tertiary',
  pulse: false,
}

/**
 * Semantic status badge with colored dot indicator.
 * @param {string} status - Order status key
 */
export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || FALLBACK

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  )
}
