import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage  = pathname === '/login'
  const isAdminRoute = pathname.startsWith('/admin')

  const token    = request.cookies.get('ttcs_token')?.value
  const userRole = request.cookies.get('ttcs_role')?.value   // 'admin' | 'operator'

  // 1. Pas de token → login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Déjà connecté → pas besoin du login
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Route /admin → réservé aux admins
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|ericsson.jpg|tt.jpg).*)'],
}