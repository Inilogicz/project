import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: clsId } = await params;
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
        const cls = await prisma.cls.findUnique({
            where: { id: clsId },
            include: {
                course: true,
                attendanceRecords: {
                    include: {
                        student: true
                    }
                },
                qrCodes: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!cls) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        // Check if student is enrolled
        const isStudentEnrolled = payload.role === 'STUDENT' && await prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId: cls.courseId,
                    studentId: payload.userId
                }
            }
        });

        // Only lecturer of the course or an admin can see full details (including QR and full attendance list)
        const isLecturerOrAdmin = payload.role === 'ADMIN' || (payload.role === 'LECTURER' && cls.course.lecturerId === payload.userId);

        if (!isLecturerOrAdmin && !isStudentEnrolled) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Return limited info for students
        if (!isLecturerOrAdmin) {
            return NextResponse.json({
                cls: {
                    id: cls.id,
                    courseTitle: cls.course.title,
                    courseCode: cls.course.code,
                    joinCode: cls.course.joinCode,
                    isActive: cls.isActive,
                }
            });
        }

        let currentQR = cls.qrCodes[0];

        // If QR is expired or missing, generate a new one
        if (!currentQR || currentQR.expiresAt < new Date()) {
            const nonce = crypto.randomBytes(16).toString('hex');
            const timestamp = Date.now();
            const rawToken = `${cls.id}-${timestamp}-${nonce}`;
            const signedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
                .update(rawToken)
                .digest('hex');

            currentQR = await prisma.qRCode.create({
                data: {
                    clsId: cls.id,
                    token: signedToken,
                    nonce,
                    expiresAt: new Date(Date.now() + 15000) // Fast refresh: 15 seconds
                }
            });
        }

        return NextResponse.json({
            cls: {
                id: cls.id,
                courseTitle: cls.course.title,
                courseCode: cls.course.code,
                joinCode: cls.course.joinCode,
                isActive: cls.isActive,
                attendanceCount: cls.attendanceRecords.filter((r: any) => r.validationStatus === 'VALID').length,
                attendanceRecords: cls.attendanceRecords
                    .filter((r: any) => r.validationStatus === 'VALID')
                    .map((r: any) => ({
                        id: r.id,
                        studentName: r.student.fullName,
                        timestamp: r.createdAt,
                        status: r.validationStatus
                    }))
            },
            qrCode: {
                token: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/check-in/${cls.id}?qrToken=${currentQR.token}`,
                expiresAt: currentQR.expiresAt
            }
        });
    } catch (error) {
        console.error('Error fetching cls:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
