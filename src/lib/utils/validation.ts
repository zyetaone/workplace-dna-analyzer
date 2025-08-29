/**
 * Shared validation utilities
 */

import * as v from 'valibot';

// Session code validation regex
export const SESSION_CODE_REGEX = /^[A-Z0-9]+-[0-9]{6}$/;

// Valibot schemas for validation
export const sessionCodeSchema = v.pipe(
  v.string(),
  v.regex(SESSION_CODE_REGEX, 'Invalid session code format')
);

export const participantNameSchema = v.pipe(
  v.string(),
  v.minLength(2, 'Name must be at least 2 characters'),
  v.maxLength(50, 'Name must be less than 50 characters')
);

export const generationSchema = v.union([
  v.picklist([
    'Baby Boomers',  // Changed to match frontend
    'Gen X',
    'Millennials',   // Changed to match frontend
    'Gen Z'
  ]),
  v.string() // Allow any string as fallback for flexibility
], 'Please select a valid generation');

export const questionIndexSchema = v.pipe(
  v.number(),
  v.minValue(0, 'Question index must be non-negative'),
  v.maxValue(100, 'Question index too large')
);

/**
 * Validate session code format (utility function for components)
 */
export function isValidSessionCode(code: string | undefined): boolean {
  return Boolean(code && SESSION_CODE_REGEX.test(code));
}

/**
 * Validate participant name (utility function for components)
 */
export function isValidParticipantName(name: string): boolean {
  return Boolean(name && name.trim().length >= 2 && name.trim().length <= 50);
}