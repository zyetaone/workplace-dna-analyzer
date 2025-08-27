/**
 * Auth Remote Functions - Server-side authentication with SvelteKit
 * Uses cookies for secure session management
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';

// Hardcoded password for simplicity
const PRESENTER_PASSWORD = 'zyetadx';

// Login schema
const LoginSchema = v.object({
	password: v.pipe(v.string(), v.minLength(1))
});

/**
 * Login command - authenticates presenter and sets cookie
 */
export const login = command(
	LoginSchema,
	async ({ password }) => {
		// Validate password
		if (password !== PRESENTER_PASSWORD) {
			throw error(401, 'Invalid password');
		}
		
		// Get the request event to access cookies
		const { cookies } = getRequestEvent();
		
		// Check if there's already a presenterId in the cookie
		let presenterId = cookies.get('presenterId');
		
		// If no existing presenterId, generate a new one
		if (!presenterId) {
			presenterId = crypto.randomUUID();
		}
		
		// Set/refresh the auth cookie
		cookies.set('presenterId', presenterId, {
			path: '/',
			httpOnly: true,
			secure: false, // Set to true in production with HTTPS
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});
		
		
		return {
			success: true,
			presenterId
		};
	}
);

/**
 * Logout command - clears authentication cookie
 */
export const logout = command(
	v.object({}),
	async () => {
		// Get the request event to access cookies
		const { cookies } = getRequestEvent();
		
		// Clear the auth cookie
		cookies.delete('presenterId', { path: '/' });
		
		
		return {
			success: true
		};
	}
);

/**
 * Check auth status - returns current authentication state
 */
export const checkAuth = command(
	v.object({}),
	async () => {
		// Get the request event to access cookies
		const { cookies } = getRequestEvent();
		
		const presenterId = cookies.get('presenterId');
		
		return {
			authenticated: !!presenterId,
			presenterId: presenterId || null
		};
	}
);