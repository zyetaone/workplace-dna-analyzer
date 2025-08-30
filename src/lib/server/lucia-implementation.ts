/**
 * Lucia Auth v3 Implementation
 * Based on official Lucia documentation for session management
 * 
 * This implements basic session management following Lucia's security guidelines:
 * - 120-bit entropy for session tokens
 * - SHA-256 hashing for secrets
 * - Constant-time comparison for validation
 * - Secure cookie configuration
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { db } from './db';
import { adminUsers, authSessions } from './db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SESSION_COOKIE_NAME = 'auth-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 1 day

// Cookie configuration following Lucia recommendations
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	path: '/',
	maxAge: SESSION_DURATION / 1000 // Convert to seconds
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate cryptographically secure random string
 * Uses 120 bits of entropy as recommended by Lucia
 */
function generateSecureRandomString(): string {
	// 15 bytes = 120 bits of entropy
	return randomBytes(15).toString('base64url');
}

/**
 * Hash a secret using SHA-256
 */
async function hashSecret(secret: string): Promise<string> {
	return createHash('sha256').update(secret).digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	
	const bufferA = Buffer.from(a);
	const bufferB = Buffer.from(b);
	
	return timingSafeEqual(bufferA, bufferB);
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface Session {
	id: string;
	userId: string;
	secretHash: string;
	expiresAt: Date;
	createdAt: Date;
	lastActivityAt: Date;
}

export interface SessionWithToken extends Session {
	token: string;
}

/**
 * Create a new session following Lucia's guidelines
 */
export async function createSession(
	userId: string,
	userAgent?: string,
	ipAddress?: string
): Promise<SessionWithToken> {
	// Generate secure random ID and secret
	const id = generateSecureRandomString();
	const secret = generateSecureRandomString();
	const secretHash = await hashSecret(secret);
	
	// Create full token (id.secret format)
	const token = `${id}.${secret}`;
	
	const expiresAt = new Date(Date.now() + SESSION_DURATION);
	const now = new Date();
	
	// Store session in database
	await db.insert(authSessions).values({
		id,
		userId,
		token: secretHash, // Store hashed secret, not plain secret
		expiresAt: expiresAt.toISOString(),
		userAgent,
		ipAddress,
		createdAt: now.toISOString(),
		lastActivityAt: now.toISOString()
	});
	
	return {
		id,
		userId,
		secretHash,
		token, // Return full token to client
		expiresAt,
		createdAt: now,
		lastActivityAt: now
	};
}

/**
 * Validate a session token
 */
export async function validateSession(
	token: string
): Promise<{ valid: boolean; session?: any; user?: any }> {
	// Parse token into ID and secret
	const parts = token.split('.');
	if (parts.length !== 2) {
		return { valid: false };
	}
	
	const [id, secret] = parts;
	
	// Retrieve session from database
	const [session] = await db.select()
		.from(authSessions)
		.where(
			and(
				eq(authSessions.id, id),
				gt(authSessions.expiresAt, new Date().toISOString())
			)
		)
		.limit(1);
	
	if (!session) {
		return { valid: false };
	}
	
	// Hash the provided secret
	const providedSecretHash = await hashSecret(secret);
	
	// Constant-time comparison of secrets
	if (!constantTimeCompare(session.token, providedSecretHash)) {
		return { valid: false };
	}
	
	// Update last activity if session is valid
	const now = new Date();
	const lastActivity = new Date(session.lastActivityAt);
	
	// Only update if more than 1 hour has passed (reduce DB writes)
	if (now.getTime() - lastActivity.getTime() > 3600000) {
		await db.update(authSessions)
			.set({ lastActivityAt: now.toISOString() })
			.where(eq(authSessions.id, id));
	}
	
	// Get user data
	const [user] = await db.select()
		.from(adminUsers)
		.where(eq(adminUsers.id, session.userId))
		.limit(1);
	
	if (!user || !user.isActive) {
		return { valid: false };
	}
	
	// Check if session needs refresh (extends expiration)
	const expiresAt = new Date(session.expiresAt);
	if (expiresAt.getTime() - now.getTime() < SESSION_REFRESH_THRESHOLD) {
		const newExpiresAt = new Date(now.getTime() + SESSION_DURATION);
		await db.update(authSessions)
			.set({ expiresAt: newExpiresAt.toISOString() })
			.where(eq(authSessions.id, id));
		session.expiresAt = newExpiresAt.toISOString();
	}
	
	// Remove password hash from user object
	const { passwordHash, ...safeUser } = user;
	
	return {
		valid: true,
		session,
		user: safeUser
	};
}

/**
 * Invalidate a session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(authSessions).where(eq(authSessions.id, sessionId));
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
	await db.delete(authSessions).where(eq(authSessions.userId, userId));
}

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================

/**
 * Create session cookie
 */
export function createSessionCookie(token: string) {
	return {
		name: SESSION_COOKIE_NAME,
		value: token,
		attributes: COOKIE_OPTIONS
	};
}

/**
 * Create blank session cookie (for logout)
 */
export function createBlankSessionCookie() {
	return {
		name: SESSION_COOKIE_NAME,
		value: '',
		attributes: {
			...COOKIE_OPTIONS,
			maxAge: 0
		}
	};
}

/**
 * Get session token from request
 */
export function getSessionToken(event: RequestEvent): string | null {
	return event.cookies.get(SESSION_COOKIE_NAME) || null;
}

/**
 * Set session cookie
 */
export function setSessionCookie(event: RequestEvent, token: string): void {
	const cookie = createSessionCookie(token);
	event.cookies.set(cookie.name, cookie.value, cookie.attributes);
}

/**
 * Delete session cookie
 */
export function deleteSessionCookie(event: RequestEvent): void {
	const cookie = createBlankSessionCookie();
	event.cookies.set(cookie.name, cookie.value, cookie.attributes);
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validate request and get user/session
 * This should be called in hooks.server.ts for every request
 */
export async function validateRequest(
	event: RequestEvent
): Promise<{ user: any | null; session: any | null }> {
	const token = getSessionToken(event);
	
	if (!token) {
		return { user: null, session: null };
	}
	
	const result = await validateSession(token);
	
	if (result.valid) {
		return {
			user: result.user,
			session: result.session
		};
	}
	
	// Clear invalid cookie
	deleteSessionCookie(event);
	
	return { user: null, session: null };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

import { verifyPassword, hashPassword } from './admin-auth';

/**
 * Login with email/username and password
 */
export async function login(
	emailOrUsername: string,
	password: string,
	event: RequestEvent
): Promise<{ success: boolean; error?: string }> {
	// Find user
	const [user] = await db.select()
		.from(adminUsers)
		.where(
			emailOrUsername.includes('@')
				? eq(adminUsers.email, emailOrUsername)
				: eq(adminUsers.username, emailOrUsername)
		)
		.limit(1);
	
	if (!user) {
		return { success: false, error: 'Invalid credentials' };
	}
	
	if (!user.isActive) {
		return { success: false, error: 'Account is disabled' };
	}
	
	// Verify password
	if (!verifyPassword(password, user.passwordHash)) {
		return { success: false, error: 'Invalid credentials' };
	}
	
	// Get user agent and IP
	const userAgent = event.request.headers.get('user-agent') || undefined;
	const ipAddress = event.getClientAddress();
	
	// Create session
	const session = await createSession(user.id, userAgent, ipAddress);
	
	// Set session cookie
	setSessionCookie(event, session.token);
	
	// Update last login
	await db.update(adminUsers)
		.set({ lastLoginAt: new Date().toISOString() })
		.where(eq(adminUsers.id, user.id));
	
	return { success: true };
}

/**
 * Logout
 */
export async function logout(event: RequestEvent): Promise<void> {
	const token = getSessionToken(event);
	
	if (token) {
		const [id] = token.split('.');
		if (id) {
			await invalidateSession(id);
		}
	}
	
	deleteSessionCookie(event);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
	const result = await db.delete(authSessions)
		.where(gt(new Date().toISOString(), authSessions.expiresAt));
	
	return result.rowsAffected ?? 0;
}

/**
 * Get active session count for a user
 */
export async function getUserSessionCount(userId: string): Promise<number> {
	const sessions = await db.select()
		.from(authSessions)
		.where(
			and(
				eq(authSessions.userId, userId),
				gt(authSessions.expiresAt, new Date().toISOString())
			)
		);
	
	return sessions.length;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<any> {
	const { user } = await validateRequest(event);
	if (!user) {
		throw new Error('Unauthorized');
	}
	return user;
}

/**
 * Require specific role
 */
export async function requireRole(
	event: RequestEvent,
	requiredRole: 'admin' | 'presenter' | 'viewer'
): Promise<any> {
	const user = await requireAuth(event);
	
	const roleHierarchy = {
		admin: 3,
		presenter: 2,
		viewer: 1
	};
	
	if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
		throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
	}
	
	return user;
}