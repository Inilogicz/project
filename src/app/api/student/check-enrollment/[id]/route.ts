import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@/types/enums';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clsId } = await params;
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || payload.role !== Role.STUDENT) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const cls = await prisma.cls.findUnique({
            where: { id: clsId },
            include: { course: true }
        });

        if (!cls) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId: cls.courseId,
                    studentId: payload.userId
                }
            }
        });

        return NextResponse.json({
            isEnrolled: !!enrollment,
            courseId: cls.courseId,
            courseTitle: cls.course.title,
            courseCode: cls.course.code,
            joinCode: cls.course.joinCode
        });

    } catch (error) {
        console.error('Check enrollment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
