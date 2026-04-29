import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signJWT } from '@/lib/auth';
import { Role } from '@/types/enums';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { institutionalEmail: email },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await signJWT({
            userId: user.id,
            email: user.institutionalEmail,
            role: user.role as unknown as Role,
        });

        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.institutionalEmail,
                role: user.role as unknown as Role,
            },
        });

        // Set cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
