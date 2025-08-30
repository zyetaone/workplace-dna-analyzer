/**
 * Simple authentication utilities for admin users
 * Uses Node.js crypto for password hashing and token generation
 * Can be upgraded to Lucia Auth later
 */

import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import { dev } from '$app/environment';
import { db } from './db/index';
import { adminUsers, authSessions, type AdminUser, type AuthSession } from './db/schema';
import { eq, and, gt, or } from 'drizzle-orm';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

// Configuration
const TOKEN_LENGTH = 32; // bytes
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const SALT_LENGTH = 16; // bytes
const ITERATIONS = 100000; // PBKDF2 iterations
const KEY_LENGTH = 64; // bytes

// Cookie configuration
export const AUTH_COOKIE_NAME = 'auth-token';
export const AUTH_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	path: '/',
	maxAge: SESSION_DURATION / 1000 // in seconds
};

/**
 * Hash a password using PBKDF2
 */
export function hashPassword(password: string): string {
	const salt = randomBytes(SALT_LENGTH);
	const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
	return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
	const [saltHex, hashHex] = storedHash.split(':');
	if (!saltHex || !hashHex) return false;
	
	const salt = Buffer.from(saltHex, 'hex');
	const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
	return hash.toString('hex') === hashHex;
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
	return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Create a new auth session
 */
export async function createSession(
	userId: string,
	userAgent?: string,
	ipAddress?: string
): Promise<{ session: AuthSession; token: string }> {
	const token = generateToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
	
	const [session] = await db.insert(authSessions).values({
		userId,
		token,
		expiresAt,
		userAgent,
		ipAddress,
		lastActivityAt: new Date().toISOString()
	}).returning();
	
	return { session, token };
}

/**
 * Validate a session token and return the user
 */
export async function validateSession(token: string): Promise<{
	user: AdminUser | null;
	session: AuthSession | null;
}> {
	if (!token) return { user: null, session: null };
	
	// Find session and check if not expired
	const [session] = await db.select()
		.from(authSessions)
		.where(
			and(
				eq(authSessions.token, token),
				gt(authSessions.expiresAt, new Date().toISOString())
			)
		)
		.limit(1);
	
	if (!session) return { user: null, session: null };
	
	// Update last activity
	await db.update(authSessions)
		.set({ lastActivityAt: new Date().toISOString() })
		.where(eq(authSessions.id, session.id));
	
	// Get user
	const [user] = await db.select()
		.from(adminUsers)
		.where(eq(adminUsers.id, session.userId))
		.limit(1);
	
	if (!user || !user.isActive) return { user: null, session: null };
	
	return { user, session };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
	await db.delete(authSessions).where(eq(authSessions.token, token));
}

/**
 * Delete all expired sessions (cleanup)
 */
export async function cleanupExpiredSessions(): Promise<number> {
	const result = await db.delete(authSessions)
		.where(gt(new Date().toISOString(), authSessions.expiresAt));
	
	return result.rowsAffected ?? 0;
}

/**
 * Login with email/username and password
 */
export async function login(
	emailOrUsername: string,
	password: string,
	userAgent?: string,
	ipAddress?: string
): Promise<{ success: boolean; user?: AdminUser; token?: string; error?: string }> {
	// Find user by email or username
	const [user] = await db.select()
		.from(adminUsers)
		.where(
			or(
				eq(adminUsers.email, emailOrUsername),
				eq(adminUsers.username, emailOrUsername)
			)
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
	
	// Update last login
	await db.update(adminUsers)
		.set({ lastLoginAt: new Date().toISOString() })
		.where(eq(adminUsers.id, user.id));
	
	// Create session
	const { token } = await createSession(user.id, userAgent, ipAddress);
	
	// Remove password hash from returned user
	const { passwordHash, ...safeUser } = user;
	
	return { success: true, user: safeUser as AdminUser, token };
}

/**
 * Create initial admin user if none exists
 */
export async function createInitialAdmin(): Promise<void> {
	const [existingAdmin] = await db.select()
		.from(adminUsers)
		.where(eq(adminUsers.role, 'admin'))
		.limit(1);
	
	if (!existingAdmin) {
		const defaultPassword = 'admin123'; // Should be changed on first login
		const passwordHash = hashPassword(defaultPassword);
		
		await db.insert(adminUsers).values({
			email: 'admin@zyeta.live',
			username: 'admin',
			passwordHash,
			role: 'admin',
			metadata: {
				name: 'System Administrator',
				preferences: {
					theme: 'dark',
					notifications: true
				}
			}
		});
		
		console.log('✅ Created initial admin user:');
		console.log('   Email: admin@zyeta.live');
		console.log('   Username: admin');
		console.log('   Password: admin123');
		console.log('   ⚠️  Please change the password after first login!');
	}
}

/**
 * Check if user has required role
 */
export function hasRole(user: AdminUser | null, requiredRole: 'admin' | 'presenter' | 'viewer'): boolean {
	if (!user) return false;
	
	const roleHierarchy = {
		admin: 3,
		presenter: 2,
		viewer: 1
	};
	
	return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Get auth token from cookies
 */
export function getAuthToken(event: RequestEvent): string | null {
	return event.cookies.get(AUTH_COOKIE_NAME) || null;
}

/**
 * Set auth cookie
 */
export function setAuthCookie(cookies: Cookies, token: string): void {
	cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Delete auth cookie
 */
export function deleteAuthCookie(cookies: Cookies): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}

/**
 * Get current user from request event
 */
export async function getCurrentUser(event: RequestEvent): Promise<AdminUser | null> {
	const token = getAuthToken(event);
	if (!token) return null;
	
	const { user } = await validateSession(token);
	return user;
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<AdminUser> {
	const user = await getCurrentUser(event);
	if (!user) {
		throw new Error('Unauthorized');
	}
	return user;
}

/**
 * Require specific role - throws error if insufficient permissions
 */
export async function requireRole(
	event: RequestEvent, 
	requiredRole: 'admin' | 'presenter' | 'viewer'
): Promise<AdminUser> {
	const user = await requireAuth(event);
	if (!hasRole(user, requiredRole)) {
		throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
	}
	return user;
}