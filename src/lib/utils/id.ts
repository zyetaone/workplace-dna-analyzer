/**
 * ID generation utilities using Web Crypto API
 * Following SvelteKit's Web Standards
 * https://svelte.dev/docs/kit/web-standards#Web-Crypto
 */

/**
 * Generate a random ID using Web Crypto API
 * @param length - Length of the ID (default: 21)
 * @returns A random alphanumeric string
 */
export function generateId(length: number = 21): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length];
	}
	
	return result;
}

/**
 * Generate a session code (uppercase alphanumeric)
 * @param length - Length of the code (default: 8)
 * @returns An uppercase alphanumeric code
 */
export function generateSessionCode(length: number = 8): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length];
	}
	
	return result;
}

/**
 * Generate a URL-safe slug with a random suffix
 * @param prefix - The prefix for the slug
 * @returns A URL-safe slug
 */
export function generateSlug(prefix: string): string {
	const random = generateId(6).toLowerCase();
	const cleanPrefix = prefix
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 50);
	
	return `${cleanPrefix}-${random}`;
}

/**
 * Generate a UUID v4 using crypto.randomUUID()
 * This is the recommended way in modern browsers and Node.js
 * @returns A standard UUID v4 string
 */
export function generateUUID(): string {
	return crypto.randomUUID();
}