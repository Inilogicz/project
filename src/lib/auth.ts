import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@/types/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-this';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    [key: string]: any;
}

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Verifies a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT with user info (Edge-compatible).
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(secretKey);
}

/**
 * Verifies a JWT and returns the payload (Edge-compatible).
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload as unknown as JWTPayload;
    } catch (error) {
        console.error("JWT Verification failed in Edge Runtime:", error);
        return null;
    }
}
