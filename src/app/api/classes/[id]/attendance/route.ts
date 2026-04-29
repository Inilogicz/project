import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role, ValidationStatus } from '@/types/enums';
import { calculateDistance, verifyToken } from '@/lib/utils';
import { isAfter } from 'date-fns';

function euclideanDistance(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return Infinity;
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

const HMAC_SECRET = process.env.HMAC_SECRET || 'qr-secret-key-change-this';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clsId } = await params;
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || payload.role !== Role.STUDENT) {
            return NextResponse.json({ error: 'Only students can mark attendance' }, { status: 403 });
        }
        const { qrToken, latitude, longitude, isLinkCheckin, faceDescriptor } = await request.json();

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!isLinkCheckin && !qrToken) {
            return NextResponse.json({ error: 'QR token required for this method' }, { status: 400 });
        }

        // 1. Validate Class
        const cls = await prisma.cls.findUnique({
            where: { id: clsId },
            include: { course: true },
        });

        if (!cls || !cls.isActive) {
            return NextResponse.json({ error: 'Class is not active' }, { status: 400 });
        }

        // Auto-end classes older than 6 hours
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        if (Date.now() - new Date(cls.startTime).getTime() > sixHoursInMs) {
            await prisma.cls.update({
                where: { id: clsId },
                data: { isActive: false, endTime: new Date(new Date(cls.startTime).getTime() + sixHoursInMs) }
            });
            return NextResponse.json({ error: 'Class has expired and is no longer active' }, { status: 400 });
        }

        // 2. Validate Student Enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId: cls.courseId,
                    studentId: payload.userId,
                },
            },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Oops! You are not registered for this course. Please verify your enrollment status.' }, { status: 403 });
        }

        // 3. Prevent Duplicates
        const existingRecord = await prisma.attendanceRecord.findUnique({
            where: {
                clsId_studentId: {
                    clsId,
                    studentId: payload.userId,
                },
            },
        });

        if (existingRecord) {
            if (existingRecord.validationStatus === ValidationStatus.VALID) {
                return NextResponse.json({
                    status: ValidationStatus.DUPLICATE,
                    message: 'Attendance already verified successfully',
                }, { status: 200 });
            }
            
            // Allow overwriting a failed attempt
            await prisma.attendanceRecord.delete({
                where: { id: existingRecord.id }
            });
        }

        // 4. Validate QR Token (if not link checkin)
        if (!isLinkCheckin) {
            const qrCode = await prisma.qRCode.findUnique({
                where: { token: qrToken },
            });

            if (!qrCode || !qrCode.isValid || qrCode.clsId !== clsId || isAfter(new Date(), qrCode.expiresAt)) {
                return NextResponse.json({
                    status: ValidationStatus.INVALID_TOKEN,
                    message: 'Invalid or expired QR code',
                }, { status: 400 });
            }
        }

        // 4.5 Facial Verification
        if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
            return NextResponse.json({ error: 'Valid face descriptor is required for check-in' }, { status: 400 });
        }

        const faceEmbedding = await prisma.faceEmbedding.findUnique({
            where: { userId: payload.userId }
        });

        if (!faceEmbedding) {
            return NextResponse.json({ error: 'Please complete your face setup in your profile before checking in' }, { status: 400 });
        }

        const dbVector = faceEmbedding.embeddingVector as number[];
        const faceDistance = euclideanDistance(faceDescriptor, dbVector);

        // Threshold 0.45 is generally good for face-api.js euclidean distance
        if (faceDistance > 0.45) {
            return NextResponse.json({ 
                error: 'Facial verification failed. Face does not match the registered user.',
                faceDistance 
            }, { status: 403 });
        }

        // 5. Geospatial Validation
        const distance = calculateDistance(
            cls.latitude,
            cls.longitude,
            latitude,
            longitude
        );

        let validationStatus: ValidationStatus = ValidationStatus.VALID;
        if (isNaN(distance) || distance > cls.radius) {
            validationStatus = ValidationStatus.INVALID_LOCATION;
        }

        // 6. Save Record for auditing purposes
        await prisma.attendanceRecord.create({
            data: {
                clsId,
                studentId: payload.userId,
                studentLatitude: latitude,
                studentLongitude: longitude,
                haversineDistanceMetres: isNaN(distance) ? 0 : distance,
                validationStatus,
            },
        });

        if (validationStatus === ValidationStatus.INVALID_LOCATION) {
            return NextResponse.json({
                status: validationStatus,
                message: 'You are not eligible to sign attendance because you are outside the geofence parameters.',
                distance: isNaN(distance) ? 0 : distance,
            }, { status: 400 });
        }

        return NextResponse.json({
            status: validationStatus,
            message: 'Attendance marked successfully',
            distance,
        }, { status: 201 });
    } catch (error) {
        console.error('Submit attendance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
