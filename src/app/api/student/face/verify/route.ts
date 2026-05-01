import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@/types/enums';
import { euclideanDistance } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || payload.role !== Role.STUDENT) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { descriptor } = await request.json();

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
            return NextResponse.json({ error: 'Valid face descriptor required' }, { status: 400 });
        }

        const faceEmbedding = await prisma.faceEmbedding.findUnique({
            where: { userId: payload.userId }
        });

        if (!faceEmbedding) {
            return NextResponse.json({ 
                error: 'Face setup not complete', 
                reason: 'NO_EMBEDDING' 
            }, { status: 404 });
        }

        const dbVector = faceEmbedding.embeddingVector as number[];
        const distance = euclideanDistance(descriptor, dbVector);

        // Use same threshold as attendance route (0.45)
        const isMatch = distance <= 0.45;

        return NextResponse.json({ 
            isMatch, 
            distance,
            threshold: 0.45
        });

    } catch (error) {
        console.error('Face verify error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
