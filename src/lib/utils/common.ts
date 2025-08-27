/**
 * Common utility functions to eliminate duplication
 */

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', { 
		month: 'short', 
		day: 'numeric', 
		hour: '2-digit', 
		minute: '2-digit' 
	});
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.error('Failed to copy:', err);
		return false;
	}
}

/**
 * Copy participant join link
 */
export function copyParticipantLink(baseUrl: string, slug: string, participantId?: string): void {
	const link = participantId 
		? `${baseUrl}/dashboard/${slug}/p/${participantId}/quiz`
		: `${baseUrl}/dashboard/${slug}/join`;
	copyToClipboard(link);
}