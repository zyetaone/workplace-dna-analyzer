/**
 * Auth Remote Functions - Server-side authentication with SvelteKit
 * Uses cookies for secure session management
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';

// Use environment variable or fallback to default
const PRESENTER_PASSWORD = process.env.PRESENTER_PASSWORD || 'zyetadx';

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
		
		// Generate or reuse presenter ID
		const presenterId = cookies.get('presenterId') || crypto.randomUUID();
		
		// Set the auth cookie
		cookies.set('presenterId', presenterId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
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

// checkAuth removed - unused in application