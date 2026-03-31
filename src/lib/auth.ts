import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@/types/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-this';

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
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
 * Signs a JWT with user info.
 */
export function signJWT(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Verifies a JWT and returns the payload.
 */
export function verifyJWT(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}
