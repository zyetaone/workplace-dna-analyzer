/**
 * Shared validation utilities
 */

// Session code validation regex
export const SESSION_CODE_REGEX = /^[A-Z0-9]+-[0-9]{6}$/;

/**
 * Validate session code format
 */
export function isValidSessionCode(code: string | undefined): boolean {
  return Boolean(code && SESSION_CODE_REGEX.test(code));
}

/**
 * Validate participant name
 */
export function isValidParticipantName(name: string): boolean {
  return Boolean(name && name.trim().length >= 2 && name.trim().length <= 50);
}

/**
 * Validate email format (for future use)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Common validation messages
 */
export const VALIDATION_MESSAGES = {
  INVALID_SESSION_CODE: 'Invalid session code format',
  SESSION_NOT_FOUND: 'Session not found',
  PARTICIPANT_NAME_TOO_SHORT: 'Name must be at least 2 characters',
  PARTICIPANT_NAME_TOO_LONG: 'Name must be less than 50 characters',
  GENERATION_REQUIRED: 'Please select your generation',
  EMAIL_INVALID: 'Please enter a valid email address'
} as const;

/**
 * Validate session code and redirect if invalid
 */
export function validateSessionCode(code: string | undefined, redirectPath: string = '/'): boolean {
  if (!isValidSessionCode(code)) {
    // In a real app, you'd use goto() here, but we can't import it in utils
    // So we'll return false and let the caller handle the redirect
    return false;
  }
  return true;
}