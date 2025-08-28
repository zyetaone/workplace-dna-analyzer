/**
 * Shared validation schemas for remote functions
 */

import * as v from 'valibot';
import { questions } from '$lib/questions';

// Core schemas for user input validation
export const sessionCodeSchema = v.pipe(
	v.string(),
	v.regex(/^[A-Z0-9]{6}$/, 'Invalid session code format')
);

export const participantNameSchema = v.pipe(
	v.string(),
	v.minLength(2, 'Name must be at least 2 characters'),
	v.maxLength(100, 'Name is too long')
);

export const sessionNameSchema = v.pipe(
	v.string(),
	v.minLength(2, 'Session name must be at least 2 characters'),
	v.maxLength(100, 'Session name is too long')
);

export const generationSchema = v.picklist(['Baby Boomers', 'Gen X', 'Millennials', 'Gen Z']);

export const questionIndexSchema = v.pipe(
	v.number(),
	v.minValue(0),
	v.maxValue(questions.length - 1)
);

export const participantIdSchema = v.pipe(
	v.string(),
	v.uuid('Invalid participant ID')
);