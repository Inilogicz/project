require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

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
            role: 'ADMIN',
        },
    });

    // Create Lecturer
    await prisma.user.upsert({
        where: { institutionalEmail: 'lecturer@university.edu' },
        update: {},
        create: {
            fullName: 'Dr. Robert Smith',
            institutionalEmail: 'lecturer@university.edu',
            password: commonPassword,
            role: 'LECTURER',
            department: 'Computer Science',
        },
    });


    await prisma.user.upsert({
        where: { institutionalEmail: 'student@university.edu' },
        update: {},
        create: {
            fullName: 'Alice Johnson',
            institutionalEmail: 'student@university.edu',
            password: commonPassword,
            role: 'STUDENT',
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
