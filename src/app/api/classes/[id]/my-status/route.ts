import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role, ValidationStatus } from '@/types/enums';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: clsId } = await params;
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== Role.STUDENT) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const record = await prisma.attendanceRecord.findUnique({
        where: {
            clsId_studentId: { clsId, studentId: payload.userId }
        },
        select: { validationStatus: true }
    });

    return NextResponse.json({
        alreadyMarked: record?.validationStatus === ValidationStatus.VALID
    });
}
