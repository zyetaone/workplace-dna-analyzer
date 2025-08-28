/**
 * Centralized type definitions for the application
 */

// Import Drizzle types for internal use
import type { Session as _Session, Participant as _Participant, PreferenceScores as _PreferenceScores } from '$lib/server/db/schema';

// Import GenerationOption from questions.ts as the single source of truth
import type { GenerationOption } from '$lib/questions';

// Re-export GenerationOption as Generation for backwards compatibility
export type Generation = GenerationOption;

// Re-export Drizzle types for external use
export type { 
	Session, 
	Participant,
	PreferenceScores 
} from '$lib/server/db/schema';