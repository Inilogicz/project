import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { URL } from 'url';

const prismaClientSingleton = () => {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

  if (DB_USER && DB_PASSWORD && DB_HOST && DB_NAME) {
    console.log('Connecting to Prisma using individual components for host:', DB_HOST);
    const pool = new pg.Pool({
      user: DB_USER,
      password: DB_PASSWORD,
      host: DB_HOST,
      port: parseInt(DB_PORT || '5432'),
      database: DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Fallback to DATABASE_URL if individual vars aren't present
  const urlString = process.env.DATABASE_URL;
  if (!urlString) {
    throw new Error('Database connection variables (DB_* or DATABASE_URL) are not defined');
  }

  try {
    const dbUrl = new URL(urlString);
    const pool = new pg.Pool({
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || '5432'),
      database: dbUrl.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false
      }
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', urlString?.replace(/:[^:@]+@/, ':****@'));
    throw error;
  }
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
