/**
 * Maintenance and system operation schemas
 */

import * as v from 'valibot';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const SeedDatabaseInput = v.object({});
export type SeedDatabaseInput = v.InferOutput<typeof SeedDatabaseInput>;

export const CleanupDatabaseInput = v.object({
	daysOld: v.optional(v.number())
});
export type CleanupDatabaseInput = v.InferOutput<typeof CleanupDatabaseInput>;

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

export const SeedDatabaseOutput = v.object({
	success: v.boolean(),
	message: v.string(),
	invalidate: v.optional(v.array(v.string()))
});
export type SeedDatabaseOutput = v.InferOutput<typeof SeedDatabaseOutput>;

export const CleanupDatabaseOutput = v.object({
	success: v.boolean(),
	message: v.string(),
	deletedSessions: v.number(),
	deletedParticipants: v.number(),
	invalidate: v.optional(v.array(v.string()))
});
export type CleanupDatabaseOutput = v.InferOutput<typeof CleanupDatabaseOutput>;
