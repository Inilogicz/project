import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: sessionId } = await params;
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
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
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

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Only lecturer of the course or an admin can see full details (including QR)
        const isAuthorized = payload.role === 'ADMIN' || (payload.role === 'LECTURER' && session.course.lecturerId === payload.userId);

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        let currentQR = session.qrCodes[0];

        // If QR is expired or missing, generate a new one
        if (!currentQR || currentQR.expiresAt < new Date()) {
            const nonce = crypto.randomBytes(16).toString('hex');
            const timestamp = Date.now();
            const rawToken = `${session.id}-${timestamp}-${nonce}`;
            const signedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
                .update(rawToken)
                .digest('hex');

            currentQR = await prisma.qRCode.create({
                data: {
                    sessionId: session.id,
                    token: signedToken,
                    nonce,
                    expiresAt: new Date(Date.now() + 15000) // Fast refresh: 15 seconds
                }
            });
        }

        return NextResponse.json({
            session: {
                id: session.id,
                courseTitle: session.course.title,
                courseCode: session.course.code,
                isActive: session.isActive,
                attendanceCount: session.attendanceRecords.length,
                attendanceRecords: session.attendanceRecords.map(r => ({
                    id: r.id,
                    studentName: r.student.fullName,
                    timestamp: r.createdAt,
                    status: r.validationStatus
                }))
            },
            qrCode: {
                token: currentQR.token,
                expiresAt: currentQR.expiresAt
            }
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
