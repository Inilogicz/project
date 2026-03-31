import { PrismaClient, Role } from '@prisma/client';

console.log('Role const:', Role);
const prisma = new PrismaClient();
console.log('User model:', prisma.user);
