import { NextResponse } from 'next/server'

// Proxy middleware — session auth is handled client-side in admin/page.js via getUser()
// This middleware just forwards requests without blocking
export async function proxy(request) {
  return NextResponse.next({
    request: { headers: request.headers },
  })
}

export const config = {
  matcher: ['/admin/:path*'],
}
