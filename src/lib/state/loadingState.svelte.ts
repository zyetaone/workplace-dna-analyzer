/**
 * Global Loading State Management
 * Centralized loading state for the application
 */

// Global loading state using Svelte 5 runes
let isLoading = $state(false);
let loadingMessage = $state<string>('');
let loadingProgress = $state<number | null>(null);

/**
 * Set the global loading state
 */
export function setLoading(loading: boolean, message: string = '') {
    isLoading = loading;
    loadingMessage = message;
    if (!loading) {
        loadingProgress = null;
    }
}

/**
 * Set loading progress (0-100)
 */
export function setLoadingProgress(progress: number | null) {
    loadingProgress = progress;
}

/**
 * Get the current loading state
 */
export function getIsLoading() {
    return isLoading;
}

/**
 * Get the current loading message
 */
export function getLoadingMessage() {
    return loadingMessage;
}

/**
 * Get the current loading progress
 */
export function getLoadingProgress() {
    return loadingProgress;
}

/**
 * Reset all loading state
 */
export function resetLoadingState() {
    isLoading = false;
    loadingMessage = '';
    loadingProgress = null;
}

/**
 * Loading state store for component usage
 */
export function getLoadingStore() {
    return {
        get isLoading() { return isLoading; },
        get message() { return loadingMessage; },
        get progress() { return loadingProgress; },
        setLoading,
        setLoadingProgress,
        reset: resetLoadingState
    };
}