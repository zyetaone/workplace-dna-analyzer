/**
 * Remote Response Utility
 * Standardized response wrapper for remote functions
 */

import type { ApiResponse } from '$lib/types';

export class RemoteResponse {
	static success<T>(data: T): ApiResponse<T> {
		return {
			success: true,
			data
		};
	}

	static error(message: string, code?: string, details?: string): ApiResponse<never> {
		return {
			success: false,
			error: {
				code: code || 'UNKNOWN_ERROR',
				message,
				details
			}
		};
	}

	static invalidate(paths: string[]): ApiResponse<null> & { invalidate: string[] } {
		return {
			success: true,
			data: null,
			invalidate: paths
		};
	}
}

// Re-export for backward compatibility
export { RemoteResponse as Response };
