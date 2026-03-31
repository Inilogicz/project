import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: sessionId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyJWT(token);

    if (!payload || payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { course: true }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session.course.lecturerId !== payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.session.update({
            where: { id: sessionId },
            data: {
                isActive: false,
                endTime: new Date()
            }
        });

        return NextResponse.json({ message: 'Session ended successfully' });
    } catch (error) {
        console.error('Error ending session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
