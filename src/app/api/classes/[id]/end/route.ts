import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: clsId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload || payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const cls = await prisma.cls.findUnique({
            where: { id: clsId },
            include: { course: true }
        });

        if (!cls) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        if (cls.course.lecturerId !== payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.cls.update({
            where: { id: clsId },
            data: {
                isActive: false,
                endTime: new Date()
            }
        });

        return NextResponse.json({ message: 'Class ended successfully' });
    } catch (error) {
        console.error('Error ending cls:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
