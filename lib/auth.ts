import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'arra-cafe-admin-secret-2026-production-key-do-not-share';
export const AUTH_COOKIE_NAME = 'arra_admin_token';

export interface TokenPayload {
  adminId: string;
  email: string;
  name: string;
  exp: number;
}

/**
 * Hash a password using PBKDF2 with SHA-512 and a random salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a password against a stored hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

/**
 * Generate a signed session token
 */
export function createAdminToken(adminId: string, email: string, name: string): string {
  // 7 days expiration
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  const payload: TokenPayload = { adminId, email, name, exp };
  
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a signed session token
 */
export function verifyAdminToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to get currently authenticated admin from cookies
 */
export async function getAuthenticatedAdmin(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}
