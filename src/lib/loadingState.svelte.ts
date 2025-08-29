/**
 * Global Loading State Management - Modern Svelte 5 Runes
 * Provides centralized loading state for the application
 */

export interface LoadingState {
	isLoading: boolean;
	message: string;
}

// Global loading state using Svelte 5 runes
let isLoading = $state(false);
let message = $state('');

// Global loading state object
export const globalLoading = $derived({
	isLoading,
	message
});

/**
 * Set global loading state
 */
export function setGlobalLoading(loading: boolean, loadingMessage: string = 'Loading...') {
	isLoading = loading;
	message = loadingMessage;
}

/**
 * Show loading with a message
 */
export function showLoading(loadingMessage: string = 'Loading...') {
	setGlobalLoading(true, loadingMessage);
}

/**
 * Hide loading
 */
export function hideLoading() {
	setGlobalLoading(false, '');
}

/**
 * Create a loading wrapper function
 */
export function withLoading<T>(
	operation: () => Promise<T>,
	loadingMessage: string = 'Loading...',
	minDuration: number = 0
): Promise<T> {
	return new Promise(async (resolve, reject) => {
		const startTime = Date.now();

		try {
			showLoading(loadingMessage);
			const result = await operation();

			// Ensure minimum loading duration
			const elapsed = Date.now() - startTime;
			if (elapsed < minDuration) {
				await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
			}

			resolve(result);
		} catch (error) {
			reject(error);
		} finally {
			hideLoading();
		}
	});
}