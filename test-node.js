const { PrismaClient } = require('@prisma/client');
try {
    const prisma = new PrismaClient();
    console.log('Successfully created PrismaClient in Node');
} catch (e) {
    console.error('Failed to create PrismaClient:', e);
}
