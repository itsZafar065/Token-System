import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // 1. PUBLIC TIMING (Always Allow PATCH for users to see if system is open)
  if (pathname === '/api/schedule' && request.method === 'PATCH') {
    return NextResponse.next();
  }

  // 2. ADMIN/STAFF AREA PROTECTION
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/staff')) {
    
    // Skip if it's the login page or login API
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      if (token) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      return NextResponse.next();
    }

    if (!token) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ success: false }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // SuperAdmin Only routes
      const superAdminOnly = ['/admin/manage', '/api/staff'];
      if (superAdminOnly.some(p => pathname.startsWith(p)) && payload.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/admin/dashboard?error=denied', request.url));
      }

      return NextResponse.next();
    } catch (e) {
      const resp = NextResponse.redirect(new URL('/admin/login', request.url));
      resp.cookies.delete('admin_token');
      return resp;
    }
  }

  return NextResponse.next();
}

export const config = { 
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/staff/:path*', '/api/tokens', '/api/schedule'] 
};