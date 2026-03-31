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

    const payload = verifyJWT(token);

    if (!payload || payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const lecturerId = payload.userId;

    try {
        // Fetch stats
        const [totalCourses, totalStudents, activeSessions] = await Promise.all([
            prisma.course.count({ where: { lecturerId } }),
            prisma.enrollment.count({ where: { course: { lecturerId } } }),
            prisma.session.count({ where: { course: { lecturerId }, isActive: true } }),
        ]);

        const courses = await prisma.course.findMany({
            where: { lecturerId },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            },
            take: 6,
            orderBy: { createdAt: 'desc' }
        });

        const lecturer = await prisma.user.findUnique({
            where: { id: lecturerId },
            select: { fullName: true, role: true }
        });

        const activeSessionsList = await prisma.session.findMany({
            where: { course: { lecturerId }, isActive: true },
            include: { course: { select: { title: true, code: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const statsData = {
            totalCourses,
            totalStudents,
            attendanceRate: "0%",
            activeSessions: activeSessions,
            activeSessionsList: activeSessionsList.map(s => ({
                id: s.id,
                courseTitle: s.course.title,
                courseCode: s.course.code,
                startTime: s.createdAt
            }))
        };

        return NextResponse.json({
            user: lecturer,
            stats: statsData,
            courses: courses.map(c => ({
                id: c.id,
                title: c.title,
                code: c.code,
                studentCount: c._count.enrollments,
            })),
        });
    } catch (error) {
        console.error('Error fetching lecturer dashboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
