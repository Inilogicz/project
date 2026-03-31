import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@/types/enums';
import { signToken, generateNonce } from '@/lib/utils';
import { addSeconds, isAfter } from 'date-fns';

const HMAC_SECRET = process.env.HMAC_SECRET || 'qr-secret-key-change-this';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clsId } = await params;
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = verifyJWT(token);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get current valid QR code
        let qrCode = await prisma.qRCode.findFirst({
            where: { clsId, isValid: true },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();

        // Check if QR is expired or missing
        if (!qrCode || isAfter(now, qrCode.expiresAt)) {
            // Invalidate old QR codes for this class
            await prisma.qRCode.updateMany({
                where: { clsId, isValid: true },
                data: { isValid: false },
            });

            // Generate new QR code
            const nonce = generateNonce();
            const expiresAt = addSeconds(now, 30);
            const qrPayload = JSON.stringify({
                clsId,
                nonce,
                expiresAt: expiresAt.getTime(),
            });
            const qrToken = signToken(qrPayload, HMAC_SECRET);

            qrCode = await prisma.qRCode.create({
                data: {
                    clsId,
                    token: qrToken,
                    nonce,
                    expiresAt,
                },
            });
        }

        return NextResponse.json({ qrCode });
    } catch (error) {
        console.error('Get QR error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
