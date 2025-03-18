import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow public paths
    if (path === '/' || path.startsWith('/auth')) {
      return NextResponse.next();
    }

    // Require authentication
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Handle role-based access
    if (path.startsWith('/dashboard/tutor') && token.role !== 'TUTOR') {
      return NextResponse.redirect(
        new URL('/dashboard/student', req.url)
      );
    }

    if (path.startsWith('/dashboard/student') && token.role !== 'STUDENT') {
      return NextResponse.redirect(
        new URL('/dashboard/tutor', req.url)
      );
    }

    // Handle default dashboard redirect
    if (path === '/dashboard') {
      if (token.role === 'TUTOR') {
        return NextResponse.redirect(
          new URL('/dashboard/tutor', req.url)
        );
      }
      if (token.role === 'STUDENT') {
        return NextResponse.redirect(
          new URL('/dashboard/student', req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

