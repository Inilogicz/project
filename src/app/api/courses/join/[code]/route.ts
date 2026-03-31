import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = verifyJWT(token);
        if (!payload || payload.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Only students can join courses' }, { status: 403 });
        }

        const course = await prisma.course.findUnique({
            where: { joinCode: code.toUpperCase() },
        });

        if (!course) {
            return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
        }

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId: course.id,
                    studentId: payload.userId,
                },
            },
        });

        if (existingEnrollment) {
            return NextResponse.json({ message: 'Already enrolled' }, { status: 200 });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                courseId: course.id,
                studentId: payload.userId,
            },
        });

        return NextResponse.json({ message: 'Successfully joined course', enrollment }, { status: 201 });
    } catch (error) {
        console.error('Join course error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
