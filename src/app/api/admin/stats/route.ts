import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/types/enums';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const payload = await verifyJWT(token);

        if (!payload || payload.role !== Role.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 1. Aggregate Core Counts
        const [totalUsers, totalCourses, totalClasses, totalAttendance] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.cls.count(),
            prisma.attendanceRecord.count()
        ]);

        // 2. Fetch all users securely (ordered by signup date)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                institutionalEmail: true,
                role: true,
                department: true,
                matricNumber: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // 3. Fetch recent attendance activities/logs
        const attendanceLogs = await prisma.attendanceRecord.findMany({
            take: 20,
            include: {
                student: {
                    select: { fullName: true, institutionalEmail: true }
                },
                cls: {
                    include: {
                        course: {
                            select: { title: true, code: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 4. Fetch active classes
        const activeClasses = await prisma.cls.findMany({
            where: { isActive: true },
            include: {
                course: {
                    select: { title: true, code: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            stats: {
                totalUsers,
                totalCourses,
                totalClasses,
                totalAttendance,
                activeClassesCount: activeClasses.length
            },
            users: users.map(u => ({
                id: u.id,
                fullName: u.fullName,
                email: u.institutionalEmail,
                role: u.role,
                department: u.department || 'General',
                matricNumber: u.matricNumber || 'N/A',
                joinedAt: u.createdAt
            })),
            activeClasses: activeClasses.map(c => ({
                id: c.id,
                courseTitle: c.course.title,
                courseCode: c.course.code,
                startTime: c.startTime
            })),
            logs: attendanceLogs.map(log => ({
                id: log.id,
                studentName: log.student.fullName,
                studentEmail: log.student.institutionalEmail,
                courseTitle: log.cls.course.title,
                courseCode: log.cls.course.code,
                distance: log.haversineDistanceMetres,
                status: log.validationStatus,
                timestamp: log.createdAt
            }))
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
