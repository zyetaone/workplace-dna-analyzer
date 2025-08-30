// Simple auth stub for build compatibility
// TODO: Implement proper authentication

export const sessionCookieName = 'auth-session';

export async function validateSessionToken(token: string) {
	return { session: null, user: null };
}

export function setSessionTokenCookie(event: any, token: string, expiresAt: Date) {
	// Stub implementation
}

export function deleteSessionTokenCookie(event: any) {
	// Stub implementation
}
