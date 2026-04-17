'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ClipboardList } from '@/components/icons'

const NAV_ITEMS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/menu', label: 'Katalog', icon: LayoutGrid },
  { href: '/history', label: 'Pesanan', icon: ClipboardList },
]

export default function NavBar() {
  const pathname = usePathname()

  /* Hide on specific routes */
  const hiddenRoutes = ['/cart', '/admin', '/login']
  if (hiddenRoutes.some(r => pathname.startsWith(r)) || /^\/menu\/.+/.test(pathname)) {
    return null
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[280px] px-4">
      <nav className="flex items-center justify-between gradient-primary rounded-full p-1.5 shadow-xl shadow-primary-glow border border-white/10 animate-slide-up">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/menu' && pathname.startsWith('/menu'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-12"
              aria-label={item.label}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white rounded-full shadow-md transition-all duration-300 animate-scale-in" />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.5}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-white/60'
                }`}
              />
              {!isActive && (
                <span className="text-[8px] font-medium mt-0.5 text-white/40 relative z-10">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}