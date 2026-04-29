import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

const PUBLIC_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/login',
    '/register',
    '/',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth') || pathname.startsWith('/models');
    if (isPublicPath) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        // Redirect to login if trying to access protected route without token
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('reason', 'no_token_cookie');
        return NextResponse.redirect(url);
    }

    const payload = await verifyJWT(token);

    if (!payload) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('reason', 'invalid_jwt_payload');
        return NextResponse.redirect(url);
    }

    // RBAC checks
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (pathname.startsWith('/lecturer') && payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (pathname.startsWith('/student') && payload.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|models).*)',
    ],
};
