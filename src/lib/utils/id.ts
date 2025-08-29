/**
 * ID generation utilities
 */

/**
 * Generate a unique ID using crypto.randomUUID()
 */
export function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Generate a session code with format: NAME-YYMMDD
 */
export function generateSessionCode(sessionName?: string): string {
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');

	// Use session name or generate a random 3-letter prefix for backward compatibility
	let prefix: string;
	if (sessionName) {
		// Clean and shorten the session name for the code
		prefix = sessionName
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric characters
			.slice(0, 8); // Limit to 8 characters

		// If the cleaned name is too short, pad with random letters
		if (prefix.length < 3) {
			const adjectives = ['TEAM', 'WORK', 'PROJ', 'SESS', 'MEET', 'COLL', 'SYNC', 'FLOW'];
			const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
			prefix = randomAdjective;
		}
	} else {
		// Fallback to random prefix for backward compatibility
		const adjectives = ['TEAM', 'WORK', 'PROJ', 'SESS', 'MEET', 'COLL', 'SYNC', 'FLOW'];
		prefix = adjectives[Math.floor(Math.random() * adjectives.length)];
	}

	return `${prefix}-${year}${month}${day}`;
}

/**
 * Generate a participant cookie ID
 */
export function generateParticipantCookieId(): string {
	return `participant_${generateId()}`;
}

/**
 * Generate a unique code for various purposes
 */
export function generateUniqueCode(length: number = 8): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Generate a session-specific participant ID
 */
export function generateParticipantId(sessionId: string): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${sessionId}_${timestamp}_${random}`;
}