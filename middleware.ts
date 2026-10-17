import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('arra_admin_token')?.value;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // If already logged in, redirect to dashboard
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Require token for all other /admin routes
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin routes
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
