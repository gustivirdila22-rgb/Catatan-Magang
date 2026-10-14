import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const OWNER_SECRET = process.env.OWNER_SECRET_CODE || 'ruangcatatan2025';
const SESSION_COOKIE_NAME = 'rc_owner_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Internal server signing secret (not shared)
const SERVER_SIGN_KEY = crypto
  .createHash('sha256')
  .update(OWNER_SECRET + '_ruang_catatan_session_salt_2025')
  .digest('hex');

// Rate limiting for login attempts
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown-ip';
}

export function checkLoginRateLimit(req: Request): { allowed: boolean; remainingWaitSeconds?: number } {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);

  if (record && record.lockedUntil && record.lockedUntil > now) {
    const remainingWaitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingWaitSeconds };
  }

  return { allowed: true };
}

export function recordLoginAttempt(req: Request, success: boolean): void {
  const ip = getClientIp(req);
  const now = Date.now();

  if (success) {
    loginRateLimitMap.delete(ip);
    return;
  }

  const record = loginRateLimitMap.get(ip) || { attempts: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    // Lock for 5 minutes after 5 failed attempts
    record.lockedUntil = now + 5 * 60 * 1000;
  }

  loginRateLimitMap.set(ip, record);
}

// Generate signed session token: timestamp.signature
function createSignedToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', SERVER_SIGN_KEY);
  hmac.update(timestamp);
  const sig = hmac.digest('hex');
  return `${timestamp}.${sig}`;
}

function verifySignedToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedSig] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration (24h)
  if (Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;

  const hmac = crypto.createHmac('sha256', SERVER_SIGN_KEY);
  hmac.update(timestampStr);
  const expectedSig = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(providedSig, 'utf-8'),
    Buffer.from(expectedSig, 'utf-8')
  );
}

export function isOwnerSession(req: Request): boolean {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return false;
  return verifySignedToken(token);
}

export function setOwnerCookie(res: Response): void {
  const token = createSignedToken();
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

export function clearOwnerCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export function verifySecretCodeInput(inputCode: string): boolean {
  if (!inputCode || typeof inputCode !== 'string') return false;
  const cleanInput = inputCode.trim();
  const expected = OWNER_SECRET.trim();
  if (cleanInput.length !== expected.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(cleanInput, 'utf-8'),
    Buffer.from(expected, 'utf-8')
  );
}

export function requireOwnerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isOwnerSession(req)) {
    res.status(401).json({
      error: 'Akses ditolak. Sesi pengelolaan pemilik diperlukan.',
      code: 'UNAUTHORIZED_OWNER',
    });
    return;
  }
  next();
}
