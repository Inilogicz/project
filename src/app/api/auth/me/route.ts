import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                fullName: true,
                institutionalEmail: true,
                role: true,
                department: true,
                matricNumber: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                ...user,
                email: user.institutionalEmail, // maintain standard mapping
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
