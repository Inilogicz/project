import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyJWT(token);

    if (!payload || payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { courseId, latitude, longitude, radius = 100 } = await request.json();

        if (!courseId || latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing required class parameters' }, { status: 400 });
        }

        // Verify course belongs to lecturer
        const course = await prisma.course.findUnique({
            where: { id: courseId, lecturerId: payload.userId }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
        }

        // Deactivate any existing active classs for this course
        await prisma.class.updateMany({
            where: { courseId, isActive: true },
            data: { isActive: false, endTime: new Date() }
        });

        // Create new class
        const class = await prisma.class.create({
            data: {
                courseId,
                latitude,
                longitude,
                radius,
                isActive: true
            }
        });

        // Generate initial QR token
        const nonce = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        const rawToken = `${class.id}-${timestamp}-${nonce}`;
        const signedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
            .update(rawToken)
            .digest('hex');

        await prisma.qRCode.create({
            data: {
                classId: class.id,
                token: signedToken,
                nonce,
                expiresAt: new Date(Date.now() + 30000) // 30 seconds expiry
            }
        });

        return NextResponse.json({
            message: 'Class started',
            classId: class.id
        });
    } catch (error) {
        console.error('Error starting class:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
