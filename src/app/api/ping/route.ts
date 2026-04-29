import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // A lightweight query to keep the database connection active
        await prisma.$queryRaw`SELECT 1`;
        
        return NextResponse.json({ 
            status: 'success', 
            message: 'Database pinged successfully. Supabase is awake! ☕' 
        }, { status: 200 });
    } catch (error) {
        console.error('Ping failed:', error);
        return NextResponse.json({ 
            status: 'error', 
            message: 'Failed to ping database' 
        }, { status: 500 });
    }
}
