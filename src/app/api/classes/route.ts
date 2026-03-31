import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@/types/enums';
import { signToken, generateNonce } from '@/lib/utils';
import { addSeconds } from 'date-fns';

const HMAC_SECRET = process.env.HMAC_SECRET || 'qr-secret-key-change-this';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = verifyJWT(token);
        if (!payload || payload.role !== Role.LECTURER) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { courseId, latitude, longitude, radius } = await request.json();

        if (!courseId || latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify course belongs to lecturer
        const course = await prisma.course.findFirst({
            where: { id: courseId, lecturerId: payload.userId },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
        }

        // Deactivate previous active classs for this course
        await prisma.class.updateMany({
            where: { courseId, isActive: true },
            data: { isActive: false, endTime: new Date() },
        });

        // Create new class
        const class = await prisma.class.create({
            data: {
                courseId,
                latitude,
                longitude,
                radius: radius || 100,
                isActive: true,
            },
        });

        // Generate initial QR code
        const nonce = generateNonce();
        const expiresAt = addSeconds(new Date(), 30);
        const qrPayload = JSON.stringify({
            classId: class.id,
            nonce,
            expiresAt: expiresAt.getTime(),
        });
        const qrToken = signToken(qrPayload, HMAC_SECRET);

        const qrCode = await prisma.qRCode.create({
            data: {
                classId: class.id,
                token: qrToken,
                nonce,
                expiresAt,
            },
        });

        return NextResponse.json({ class, qrCode }, { status: 201 });
    } catch (error) {
        console.error('Start class error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
