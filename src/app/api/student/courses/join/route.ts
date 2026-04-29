import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload || payload.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { joinCode } = await request.json();

        if (!joinCode) {
            return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
        }

        // Find course by join code
        const course = await prisma.course.findUnique({
            where: { joinCode: joinCode.toUpperCase() }
        });

        if (!course) {
            return NextResponse.json({ error: 'Invalid join code. Course not found.' }, { status: 404 });
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId: course.id,
                    studentId: payload.userId
                }
            }
        });

        if (existingEnrollment) {
            return NextResponse.json({ error: 'You are already enrolled in this course.' }, { status: 400 });
        }

        // Create enrollment
        await prisma.enrollment.create({
            data: {
                courseId: course.id,
                studentId: payload.userId
            }
        });

        return NextResponse.json({ message: 'Successfully joined ' + course.title });
    } catch (error) {
        console.error('Error joining course:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
