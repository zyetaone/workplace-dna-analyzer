/**
 * # Consolidated Validation Utilities
 *
 * Comprehensive validation system with standardized error messages,
 * reusable validation helpers, and consistent patterns across the application.
 *
 * ## Features
 *
 * - **Standardized Error Messages**: Consistent error format across all validations
 * - **Type-Safe Validation**: Full TypeScript support with Valibot schemas
 * - **Reusable Helpers**: Common validation patterns extracted for reuse
 * - **Performance Optimized**: Efficient validation with minimal overhead
 * - **Extensible**: Easy to add new validation rules and schemas
 *
 * ## Error Message Standards
 *
 * All error messages follow this format:
 * - Clear and concise (under 50 characters when possible)
 * - User-friendly language (avoid technical jargon)
 * - Actionable guidance (tell user what to do)
 * - Consistent capitalization and punctuation
 */

import * as v from 'valibot';

// ============================================================================
// CONSTANTS & REGEX PATTERNS
// ============================================================================

/** Session code validation regex - uppercase letters/numbers + dash + 6 digits */
export const SESSION_CODE_REGEX = /^[A-Z0-9]+-[0-9]{6}$/;

/** Email validation regex - basic email format */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone validation regex - basic international format */
export const PHONE_REGEX = /^\+?[\d\s\-()]{10,}$/;

/** URL validation regex - basic URL format */
export const URL_REGEX = /^https?:\/\/.+/;

/** Password strength requirements */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// ============================================================================
// STANDARD ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
	REQUIRED: 'This field is required',
	INVALID_FORMAT: 'Invalid format',
	TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
	TOO_LONG: (max: number) => `Must be less than ${max} characters`,
	INVALID_EMAIL: 'Please enter a valid email address',
	INVALID_PHONE: 'Please enter a valid phone number',
	INVALID_URL: 'Please enter a valid URL',
	WEAK_PASSWORD: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
	INVALID_SESSION_CODE: 'Session code must be in format: ABC123-123456',
	INVALID_NAME: 'Name must be 2-50 characters long',
	INVALID_GENERATION: 'Please select a valid generation',
	OUT_OF_RANGE: (min: number, max: number) => `Must be between ${min} and ${max}`,
	INVALID_CHOICE: 'Please select a valid option'
} as const;

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * Session code validation schema
 * Format: ABC123-123456 (uppercase letters/numbers + dash + 6 digits)
 */
export const sessionCodeSchema = v.pipe(
	v.string(),
	v.minLength(1, ERROR_MESSAGES.REQUIRED),
	v.regex(SESSION_CODE_REGEX, ERROR_MESSAGES.INVALID_SESSION_CODE)
);

/**
 * Participant name validation schema
 * Length: 2-50 characters, trimmed
 */
export const participantNameSchema = v.pipe(
	v.string(),
	v.transform((val) => val.trim()),
	v.minLength(1, ERROR_MESSAGES.REQUIRED),
	v.minLength(2, ERROR_MESSAGES.INVALID_NAME),
	v.maxLength(50, ERROR_MESSAGES.INVALID_NAME)
);

/**
 * Generation selection schema
 * Supports predefined generations with fallback for flexibility
 */
export const generationSchema = v.union(
	[
		v.picklist(['Baby Boomers', 'Gen X', 'Millennials', 'Gen Z']),
		v.string() // Allow any string as fallback for flexibility
	],
	ERROR_MESSAGES.INVALID_GENERATION
);

/**
 * Question index validation schema
 * Non-negative integer, reasonable upper bound
 */
export const questionIndexSchema = v.pipe(
	v.number(),
	v.minValue(0, ERROR_MESSAGES.OUT_OF_RANGE(0, 100)),
	v.maxValue(100, ERROR_MESSAGES.OUT_OF_RANGE(0, 100))
);

/**
 * Email validation schema
 */
export const emailSchema = v.pipe(
	v.string(),
	v.minLength(1, ERROR_MESSAGES.REQUIRED),
	v.regex(EMAIL_REGEX, ERROR_MESSAGES.INVALID_EMAIL)
);

/**
 * Phone number validation schema
 */
export const phoneSchema = v.pipe(
	v.string(),
	v.minLength(1, ERROR_MESSAGES.REQUIRED),
	v.regex(PHONE_REGEX, ERROR_MESSAGES.INVALID_PHONE)
);

/**
 * URL validation schema
 */
export const urlSchema = v.pipe(
	v.string(),
	v.minLength(1, ERROR_MESSAGES.REQUIRED),
	v.regex(URL_REGEX, ERROR_MESSAGES.INVALID_URL)
);

/**
 * Password validation schema
 */
export const passwordSchema = v.pipe(
	v.string(),
	v.minLength(1, ERROR_MESSAGES.REQUIRED),
	v.minLength(PASSWORD_MIN_LENGTH, ERROR_MESSAGES.WEAK_PASSWORD),
	v.maxLength(PASSWORD_MAX_LENGTH, ERROR_MESSAGES.WEAK_PASSWORD)
);

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate session code format (utility function for components)
 * @param code - Session code to validate
 * @returns true if valid, false otherwise
 */
export function isValidSessionCode(code: string | undefined): boolean {
	if (!code) return false;
	return SESSION_CODE_REGEX.test(code);
}

/**
 * Validate participant name (utility function for components)
 * @param name - Name to validate
 * @returns true if valid, false otherwise
 */
export function isValidParticipantName(name: string): boolean {
	if (!name) return false;
	const trimmed = name.trim();
	return trimmed.length >= 2 && trimmed.length <= 50;
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
	if (!email) return false;
	return EMAIL_REGEX.test(email);
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
	if (!phone) return false;
	return PHONE_REGEX.test(phone);
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
	if (!url) return false;
	return URL_REGEX.test(url);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns true if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
	if (!password) return false;
	return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

// ============================================================================
// ADVANCED VALIDATION HELPERS
// ============================================================================

/**
 * Create a required string schema with custom length constraints
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (default: 1000)
 * @param fieldName - Field name for error messages (default: "field")
 * @returns Valibot schema
 */
export function createRequiredStringSchema(
	minLength: number = 1,
	maxLength: number = 1000,
	fieldName: string = 'field'
) {
	return v.pipe(
		v.string(),
		v.minLength(1, `${fieldName} is required`),
		v.minLength(minLength, ERROR_MESSAGES.TOO_SHORT(minLength)),
		v.maxLength(maxLength, ERROR_MESSAGES.TOO_LONG(maxLength))
	);
}

/**
 * Create an optional string schema with length constraints
 * @param minLength - Minimum length when provided (default: 0)
 * @param maxLength - Maximum length (default: 1000)
 * @returns Valibot schema
 */
export function createOptionalStringSchema(minLength: number = 0, maxLength: number = 1000) {
	return v.pipe(
		v.optional(v.string()),
		v.transform((val) => val?.trim() || ''),
		v.check((val) => val === '' || val.length >= minLength, ERROR_MESSAGES.TOO_SHORT(minLength)),
		v.check((val) => val === '' || val.length <= maxLength, ERROR_MESSAGES.TOO_LONG(maxLength))
	);
}

/**
 * Create a number range schema
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Field name for error messages (default: "value")
 * @returns Valibot schema
 */
export function createNumberRangeSchema(min: number, max: number, fieldName: string = 'value') {
	return v.pipe(
		v.number(),
		v.minValue(min, `${fieldName} must be at least ${min}`),
		v.maxValue(max, `${fieldName} must be no more than ${max}`)
	);
}

/**
 * Validate data against a schema and return detailed error information
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @returns Validation result with detailed error information
 */
export function validateWithDetails<T>(
	schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
	data: unknown
): {
	success: boolean;
	data?: T;
	errors?: Array<{
		field: string;
		message: string;
		code: string;
	}>;
} {
	const result = v.safeParse(schema, data);

	if (result.success) {
		return { success: true, data: result.output };
	}

	const errors = result.issues.map((issue) => ({
		field: issue.path?.map((p) => String(p.key)).join('.') || 'unknown',
		message: issue.message || 'Validation error',
		code: issue.kind
	}));

	return { success: false, errors };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for session code validation */
export type SessionCode = v.InferOutput<typeof sessionCodeSchema>;

/** Type for participant name validation */
export type ParticipantName = v.InferOutput<typeof participantNameSchema>;

/** Type for generation validation */
export type Generation = v.InferOutput<typeof generationSchema>;

/** Type for question index validation */
export type QuestionIndex = v.InferOutput<typeof questionIndexSchema>;

/** Type for email validation */
export type Email = v.InferOutput<typeof emailSchema>;

/** Type for phone validation */
export type Phone = v.InferOutput<typeof phoneSchema>;

/** Type for URL validation */
export type Url = v.InferOutput<typeof urlSchema>;

/** Type for password validation */
export type Password = v.InferOutput<typeof passwordSchema>;
