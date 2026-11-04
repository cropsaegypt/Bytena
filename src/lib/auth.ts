import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { UserSession } from './types';

const SESSION_COOKIE_NAME = 'baytna_session';
const PIN_TOKEN_COOKIE_NAME = 'baytna_pin_token';
const SECRET_KEY = process.env.AUTH_SECRET || 'baytna-ultra-secure-key-2026-fady-rahma';

/**
 * Hash password securely using PBKDF2 with SHA-512
 */
export function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(secret, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext secret against stored salt:hash
 */
export function verifySecret(secret: string, stored: string): boolean {
  // If fallback or unhashed pin (e.g. initial '1234')
  if (!stored.includes(':')) {
    return secret === stored;
  }
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(secret, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * Create a signed session token
 */
export function createSignedToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

/**
 * Verify and decode a signed session token
 */
export function verifySignedToken<T = any>(token: string): T | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
    if (signature !== expectedSig) return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as T;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user session on the server
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const pinToken = cookieStore.get(PIN_TOKEN_COOKIE_NAME)?.value;

  let activeUserId = 'fady'; // Default fallback user for convenient preview
  if (sessionToken) {
    const verified = verifySignedToken<{ userId: string }>(sessionToken);
    if (verified?.userId) {
      activeUserId = verified.userId;
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: activeUserId },
      include: { household: true },
    });

    if (!user) return null;

    // Check if health profile is unlocked via PIN
    let isHealthUnlocked = false;
    if (pinToken) {
      const pinPayload = verifySignedToken<{ userId: string; unlockedAt: number }>(pinToken);
      if (pinPayload?.userId === user.id && Date.now() - pinPayload.unlockedAt < 3600000) {
        isHealthUnlocked = true;
      }
    }

    return {
      id: user.id,
      displayName: user.displayName,
      role: user.role as any,
      avatar: user.avatar || (user.id === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳'),
      householdId: user.householdId,
      isHealthUnlocked,
    };
  } catch (err) {
    console.error('Error getting current user:', err);
    // Safe fallback mock when database is preparing
    return {
      id: activeUserId,
      displayName: activeUserId === 'fady' ? 'فادي' : 'رحمة',
      role: activeUserId === 'fady' ? 'OWNER_FADY' : 'OWNER_RAHMA',
      avatar: activeUserId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳',
      householdId: 'baytna-main',
      isHealthUnlocked: false,
    };
  }
}
