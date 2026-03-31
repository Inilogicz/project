import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyJWT(token);

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lecturer: {
                    select: { fullName: true, id: true }
                },
                enrollments: {
                    include: {
                        student: {
                            select: { id: true, fullName: true, matricNumber: true, institutionalEmail: true }
                        }
                    }
                },
                sessions: {
                    include: {
                        _count: {
                            select: { attendanceRecords: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Authorization check
        const isLecturer = payload.role === 'LECTURER' && course.lecturerId === payload.userId;
        const isAdmin = payload.role === 'ADMIN';
        const isStudent = payload.role === 'STUDENT' && course.enrollments.some(e => e.studentId === payload.userId);

        if (!isLecturer && !isAdmin && !isStudent) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Calculate student-specific stats for lecturer/admin
        let students: any[] = [];
        if (isLecturer || isAdmin) {
            students = course.enrollments.map(e => {
                return {
                    id: e.student.id,
                    fullName: e.student.fullName,
                    matricNumber: e.student.matricNumber,
                    email: e.student.institutionalEmail,
                    joinedAt: e.enrolledAt
                };
            });
        }

        return NextResponse.json({
            course: {
                id: course.id,
                title: course.title,
                code: course.code,
                description: course.description,
                joinCode: course.joinCode,
                lecturerName: course.lecturer.fullName,
                stats: {
                    totalStudents: course.enrollments.length,
                    totalSessions: course.sessions.length,
                }
            },
            students: isLecturer || isAdmin ? students : [],
            sessions: course.sessions.map(s => ({
                id: s.id,
                createdAt: s.createdAt,
                attendanceCount: s._count.attendanceRecords,
                isActive: s.isActive
            }))
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
