'use client'

import { usePathname } from 'next/navigation'
import NavBar from '@/components/NavBar'

// Routes that get full-width layout (no mobile shell)
const FULL_WIDTH_ROUTES = ['/admin', '/login']

export default function LayoutShell({ children }) {
  const pathname = usePathname()
  const isFullWidth = FULL_WIDTH_ROUTES.some((r) => pathname?.startsWith(r))

  if (isFullWidth) {
    // Admin & Login — full width, no bottom nav, no mobile wrapper
    return (
      <div className="w-full min-h-screen bg-bg">
        {children}
      </div>
    )
  }

  // User pages — mobile app shell with centered max-w-md
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-md min-h-screen bg-bg relative shadow-2xl overflow-x-hidden border-x border-border">
        {children}
        <NavBar />
      </div>
    </div>
  )
}
