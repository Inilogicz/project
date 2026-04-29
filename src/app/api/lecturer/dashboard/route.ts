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

    if (!payload || payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const lecturerId = payload.userId;

    try {
        // Expire active classes older than 6 hours
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        await prisma.cls.updateMany({
            where: { course: { lecturerId }, isActive: true, startTime: { lt: sixHoursAgo } },
            data: { isActive: false, endTime: new Date() }
        });

        // Fetch stats
        const [totalCourses, totalStudents, activeClses] = await Promise.all([
            prisma.course.count({ where: { lecturerId } }),
            prisma.enrollment.count({ where: { course: { lecturerId } } }),
            prisma.cls.count({ where: { course: { lecturerId }, isActive: true } }),
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

        const activeClsesList = await prisma.cls.findMany({
            where: { course: { lecturerId }, isActive: true },
            include: { course: { select: { title: true, code: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const statsData = {
            totalCourses,
            totalStudents,
            attendanceRate: "0%",
            activeClses: activeClses,
            activeClsesList: activeClsesList.map(s => ({
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
