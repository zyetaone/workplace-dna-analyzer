/**
 * Auth Remote Functions - Server-side authentication with SvelteKit
 * Optimized with proper error handling, validation, and security
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { 
	RemoteError, 
	handleDatabaseError, 
	withRetry, 
	validateAndParse,
	formatSuccessResponse
} from '$lib/server/remote-utils';

// ============= VALIDATION SCHEMAS =============

const LoginSchema = v.object({
	password: v.optional(v.pipe(v.string(), v.maxLength(255)))
});

const LogoutSchema = v.object({});

const CheckAuthSchema = v.object({
	presenterId: v.optional(v.pipe(v.string(), v.minLength(1)))
});

// ============= COOKIE CONFIGURATION =============

const COOKIE_CONFIG = {
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: 60 * 60 * 24 * 7 // 1 week
};

// ============= AUTHENTICATION UTILITIES =============

function generatePresenterId(): string {
	return crypto.randomUUID();
}

function setCookieWithRetry(cookies: any, name: string, value: string) {
	try {
		cookies.set(name, value, COOKIE_CONFIG);
	} catch (err) {
		throw new RemoteError(500, 'Failed to set authentication cookie', 'COOKIE_ERROR');
	}
}

// ============= COMMAND FUNCTIONS =============

/**
 * Login command with enhanced error handling and validation
 * POC version without password requirement - ready for production upgrade
 */
export const login = command(
	LoginSchema,
	async (input) => {
		const { password } = validateAndParse(LoginSchema, input);
		
		return withRetry(async () => {
			// POC: No password validation - auto-approve all logins
			// TODO: In production, implement proper password validation:
			// if (password && !await verifyPassword(password)) {
			//     throw new RemoteError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
			// }
			
			const { cookies } = getRequestEvent();
			
			// Generate or reuse presenter ID
			let presenterId = cookies.get('presenterId');
			if (!presenterId) {
				presenterId = generatePresenterId();
			}
			
			// Set authentication cookie with error handling
			setCookieWithRetry(cookies, 'presenterId', presenterId);
			
			return formatSuccessResponse({
				presenterId,
				expiresAt: new Date(Date.now() + COOKIE_CONFIG.maxAge * 1000)
			}, 'Login successful');
		});
	}
);

/**
 * Logout command with proper cleanup and error handling
 */
export const logout = command(
	LogoutSchema,
	async (input) => {
		validateAndParse(LogoutSchema, input);
		
		return withRetry(async () => {
			const { cookies } = getRequestEvent();
			
			// Clear the authentication cookie
			try {
				cookies.delete('presenterId', { path: '/' });
			} catch (err) {
				// Log error but don't fail the logout
				console.warn('Failed to clear authentication cookie:', err);
			}
			
			return formatSuccessResponse({}, 'Logout successful');
		});
	}
);

/**
 * Check authentication status
 * Useful for client-side auth state validation
 */
export const checkAuth = command(
	CheckAuthSchema,
	async (input) => {
		const { presenterId: providedId } = validateAndParse(CheckAuthSchema, input);
		
		const { cookies } = getRequestEvent();
		const cookiePresenterId = cookies.get('presenterId');
		
		// Check if presenter ID matches cookie
		const isAuthenticated = Boolean(cookiePresenterId);
		const isValidSession = providedId ? providedId === cookiePresenterId : true;
		
		if (!isAuthenticated) {
			throw new RemoteError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
		}
		
		if (!isValidSession) {
			throw new RemoteError(401, 'Invalid session', 'INVALID_SESSION');
		}
		
		return formatSuccessResponse({
			presenterId: cookiePresenterId,
			isAuthenticated: true
		}, 'Authentication valid');
	}
);