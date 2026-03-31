import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { Role } from '@/types/enums';

export async function POST(request: Request) {
    try {
        const { fullName, email, password, role, department, matricNumber } = await request.json();

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

        return NextResponse.json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.institutionalEmail,
                role: user.role,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
