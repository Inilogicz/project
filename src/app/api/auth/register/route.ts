import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signJWT } from '@/lib/auth';
import { Role } from '@/types/enums';

export async function POST(request: Request) {
    try {
        const { fullName, email, password, role, department, matricNumber, faceEmbedding } = await request.json();

        if (!fullName || !email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { institutionalEmail: email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        if (role === Role.STUDENT && !matricNumber) {
            return NextResponse.json({ error: 'Matric number is required for students' }, { status: 400 });
        }

        if (role === Role.STUDENT && (!faceEmbedding || !Array.isArray(faceEmbedding) || faceEmbedding.length !== 128)) {
            return NextResponse.json({ error: 'Valid face embedding is required for students' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                fullName,
                institutionalEmail: email,
                password: hashedPassword,
                role: role as Role,
                department,
                matricNumber: role === Role.STUDENT ? matricNumber : null,
            },
        });

        if (role === Role.STUDENT && faceEmbedding) {
            await prisma.faceEmbedding.create({
                data: {
                    userId: user.id,
                    embeddingVector: faceEmbedding,
                }
            });
        }

        const token = await signJWT({
            userId: user.id,
            email: user.institutionalEmail,
            role: user.role as unknown as Role,
        });

        return NextResponse.json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.institutionalEmail,
                role: user.role,
            },
            token,
        }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
