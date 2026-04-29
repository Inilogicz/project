import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        let courses: any[] = [];

        if (payload.role === 'LECTURER') {
            courses = await prisma.course.findMany({
                where: { lecturerId: payload.userId },
                include: {
                    _count: {
                        select: { enrollments: true, classes: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (payload.role === 'STUDENT') {
            const enrollments = await prisma.enrollment.findMany({
                where: { studentId: payload.userId },
                include: {
                    course: {
                        include: {
                            lecturer: {
                                select: { fullName: true }
                            },
                            _count: {
                                select: { classes: true }
                            }
                        }
                    }
                },
                orderBy: { enrolledAt: 'desc' }
            });
            courses = enrollments.map(e => ({
                ...e.course,
                enrolledAt: e.enrolledAt
            }));
        }

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('Error fetching courses list:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
