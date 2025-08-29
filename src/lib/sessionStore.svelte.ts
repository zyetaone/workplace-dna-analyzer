/**
 * Main Session Store - Re-exports from Admin Session Store
 * This provides a centralized entry point for session management
 */

// Main session store (working)
export * from '../routes/admin/admin.svelte';

// Export the main function for creating session stores
export { getSessionStore } from '../routes/admin/admin.svelte';

// Re-export types for convenience
export type {
  Session,
  Participant,
  PreferenceScores,
  Generation
} from '$lib/types';

export type {
  SessionWithCounts
} from '$lib/server/db/schema';