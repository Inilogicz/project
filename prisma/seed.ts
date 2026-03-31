import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const urlString = process.env.DATABASE_URL;
if (!urlString) {
    throw new Error('DATABASE_URL is not defined');
}

enum Role {
    ADMIN = 'ADMIN',
    LECTURER = 'LECTURER',
    STUDENT = 'STUDENT'
}

const pool = new pg.Pool({ connectionString: urlString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('password123', salt);

    console.log('Seeding database...');

    // Create Admin
    await prisma.user.upsert({
        where: { institutionalEmail: 'admin@university.edu' },
        update: {},
        create: {
            fullName: 'System Administrator',
            institutionalEmail: 'admin@university.edu',
            password: commonPassword,
            role: Role.ADMIN,
        },
    });

    // Create Lecturer
    const lecturer = await prisma.user.upsert({
        where: { institutionalEmail: 'lecturer@university.edu' },
        update: {},
        create: {
            fullName: 'Dr. Robert Smith',
            institutionalEmail: 'lecturer@university.edu',
            password: commonPassword,
            role: Role.LECTURER,
            department: 'Computer Science',
        },
    });

    // Create Student
    await prisma.user.upsert({
        where: { institutionalEmail: 'student@university.edu' },
        update: {},
        create: {
            fullName: 'Alice Johnson',
            institutionalEmail: 'student@university.edu',
            password: commonPassword,
            role: Role.STUDENT,
            matricNumber: 'U12345678',
            department: 'Computer Science',
        },
    });

    console.log('Seed completed successfully!');
    console.log('Credentials:');
    console.log('- Admin: admin@university.edu / password123');
    console.log('- Lecturer: lecturer@university.edu / password123');
    console.log('- Student: student@university.edu / password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
