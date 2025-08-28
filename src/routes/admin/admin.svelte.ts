/**
 * Admin Dashboard State - Optimized class-based approach with Svelte 5 runes
 */

import type { SessionWithCounts } from '$lib/server/db/schema';
import { getAllSessionsRemote, createSessionRemote, deleteSessionRemote } from './admin.remote';

export class AdminDashboardState {
	// Reactive state
	sessions = $state<SessionWithCounts[]>([]);
	isLoading = $state(false);
	error = $state('');

	// Computed properties
	stats = $derived({
		total: this.sessions.length,
		active: this.sessions.filter(s => s.isActive).length,
		totalParticipants: this.sessions.reduce((sum, s) => sum + (s.activeCount + s.completedCount), 0),
		completedSurveys: this.sessions.reduce((sum, s) => sum + s.completedCount, 0)
	});

	// Private error handler
	private handleError = (err: unknown, fallback: string) => 
		err instanceof Error ? err.message : fallback;

	/**
	 * Load all sessions from server
	 */
	loadSessions = async () => {
		this.isLoading = true;
		this.error = '';
		
		try {
			this.sessions = await getAllSessionsRemote({}) || [];
		} catch (err) {
			this.error = this.handleError(err, 'Failed to load sessions');
		} finally {
			this.isLoading = false;
		}
	};

	/**
	 * Create new session and refresh list
	 */
	createSession = async (name: string) => {
		try {
			const result = await createSessionRemote({ name: name.trim() });
			if (result.success) await this.loadSessions();
			return result;
		} catch (err) {
			return { success: false, error: this.handleError(err, 'Failed to create session') };
		}
	};

	/**
	 * Delete session with optimistic update and rollback
	 */
	deleteSession = async (code: string) => {
		const originalSessions = [...this.sessions];
		this.sessions = this.sessions.filter(s => s.code !== code);

		try {
			const result = await deleteSessionRemote({ code });
			if (!result.success) this.sessions = originalSessions;
			return result;
		} catch (err) {
			this.sessions = originalSessions;
			return { success: false, error: this.handleError(err, 'Failed to delete session') };
		}
	};
}

// Export singleton instance
export const adminState = new AdminDashboardState();