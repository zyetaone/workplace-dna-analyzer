/**
 * Centralized error handling utilities
 * Provides consistent error logging and user-friendly error messages
 */

// Standardized error handler
export function handleError(error: unknown, context: string, showToUser = true): string {
	console.error(`Error in ${context}:`, error);
	
	if (error instanceof Error) {
		// Return user-friendly message
		if (showToUser) {
			return getUserFriendlyMessage(error.message, context);
		}
		return error.message;
	}
	
	return showToUser ? getDefaultErrorMessage(context) : 'Unknown error';
}

// Convert technical error messages to user-friendly ones
function getUserFriendlyMessage(technicalMessage: string, context: string): string {
	const lowerMsg = technicalMessage.toLowerCase();
	
	if (lowerMsg.includes('session not found')) {
		return 'Session not found. Please check your link and try again.';
	}
	
	if (lowerMsg.includes('participant not found')) {
		return 'Participant not found. Please rejoin the session.';
	}
	
	if (lowerMsg.includes('session inactive') || lowerMsg.includes('session ended')) {
		return 'This session has ended. Please contact the presenter.';
	}
	
	if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
		return 'Network error. Please check your connection and try again.';
	}
	
	if (lowerMsg.includes('validation') || lowerMsg.includes('invalid')) {
		return 'Invalid data provided. Please check your input.';
	}
	
	return getDefaultErrorMessage(context);
}

// Context-specific default error messages
function getDefaultErrorMessage(context: string): string {
	const contextMessages: Record<string, string> = {
		'login': 'Login failed. Please try again.',
		'session creation': 'Failed to create session. Please try again.',
		'session loading': 'Failed to load session. Please refresh the page.',
		'joining session': 'Failed to join session. Please try again.',
		'saving response': 'Failed to save your response. Please try again.',
		'completing quiz': 'Failed to submit results. Please try again.',
		'loading participant': 'Failed to load participant data. Please refresh.'
	};
	
	return contextMessages[context] || 'An unexpected error occurred. Please try again.';
}

// Error boundary wrapper for async operations
export async function withErrorHandling<T>(
	operation: () => Promise<T>,
	context: string,
	onError?: (message: string) => void
): Promise<T | null> {
	try {
		return await operation();
	} catch (error) {
		const message = handleError(error, context);
		if (onError) {
			onError(message);
		}
		return null;
	}
}

// Retry wrapper with exponential backoff
export async function withRetry<T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	backoffMs = 1000
): Promise<T> {
	let lastError: Error;
	
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;
			
			if (attempt === maxRetries) {
				break;
			}
			
			// Exponential backoff with jitter
			const delay = backoffMs * Math.pow(2, attempt) + Math.random() * 100;
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
	
	throw lastError;
}