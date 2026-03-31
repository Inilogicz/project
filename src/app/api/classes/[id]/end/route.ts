import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: classId } = await params;
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
        const class = await prisma.class.findUnique({
            where: { id: classId },
            include: { course: true }
        });

        if (!class) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        if (class.course.lecturerId !== payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.class.update({
            where: { id: classId },
            data: {
                isActive: false,
                endTime: new Date()
            }
        });

        return NextResponse.json({ message: 'Class ended successfully' });
    } catch (error) {
        console.error('Error ending class:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
