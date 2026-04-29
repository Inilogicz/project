import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { customAlphabet } from 'nanoid';

const generateJoinCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload || payload.role !== 'LECTURER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { title, code, description } = await request.json();

        if (!title || !code) {
            return NextResponse.json({ error: 'Title and code are required' }, { status: 400 });
        }

        // Check if course code already exists
        const existingCourse = await prisma.course.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (existingCourse) {
            return NextResponse.json({ error: 'Course code already exists' }, { status: 400 });
        }

        // Generate a unique join code
        let joinCode = generateJoinCode();
        let joinCodeExists = true;
        while (joinCodeExists) {
            const existingJoinCode = await prisma.course.findUnique({
                where: { joinCode }
            });
            if (!existingJoinCode) joinCodeExists = false;
            else joinCode = generateJoinCode();
        }

        const course = await prisma.course.create({
            data: {
                title,
                code: code.toUpperCase(),
                description,
                joinCode,
                lecturerId: payload.userId
            }
        });

        return NextResponse.json({
            message: 'Course created successfully',
            courseId: course.id,
            joinCode: course.joinCode
        });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
