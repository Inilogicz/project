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

    if (!payload || payload.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const studentId = payload.userId;

    try {
        // Fetch student and their enrollments
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                enrollments: {
                    include: {
                        course: {
                            include: {
                                classes: {
                                    include: {
                                        attendanceRecords: {
                                            where: { studentId: studentId }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Calculate stats and course data
        const courses = student.enrollments.map(enrollment => {
            const course = enrollment.course;
            const totalClasses = course.classes.length;
            const attendedCount = course.classes.filter(s => s.attendanceRecords.length > 0).length;
            const attendancePercent = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 100;

            let status: 'perfect' | 'on track' | 'low' = 'on track';
            if (attendancePercent >= 95) status = 'perfect';
            else if (attendancePercent < 75) status = 'low';

            return {
                id: course.id,
                title: course.title,
                code: course.code,
                attendance: `${attendancePercent}%`,
                status
            };
        });

        const overallAttendance = courses.length > 0
            ? Math.round(courses.reduce((acc: number, c: any) => acc + parseInt(c.attendance), 0) / courses.length)
            : 100;

        const activeClses = await prisma.cls.findMany({
            where: {
                course: {
                    enrollments: { some: { studentId } }
                },
                isActive: true
            },
            include: {
                course: {
                    select: { title: true, code: true }
                }
            }
        });

        return NextResponse.json({
            user: {
                fullName: student.fullName,
                role: student.role,
            },
            stats: {
                overallAttendance: `${overallAttendance}%`,
                topPerformer: true,
                activeClsesCount: activeClses.length,
                activeClses: activeClses.map(s => ({
                    id: s.id,
                    courseTitle: s.course.title,
                    courseCode: s.course.code,
                    startTime: s.createdAt
                }))
            },
            courses,
        });
    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
