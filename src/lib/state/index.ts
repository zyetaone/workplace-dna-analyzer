/**
 * Central State Management Export
 * Provides unified access to all state management classes
 */

// Re-export dashboard state
export { 
	DashboardState, 
	dashboardState,
	type SessionWithCounts,
	type DashboardAnalytics 
} from '$routes/dashboard/dashboard.svelte.ts';

// Re-export quiz state
export { 
	QuizState, 
	createQuizState,
	type Question,
	type Option,
	type PreferenceScores,
	type Generation 
} from '$routes/dashboard/[slug]/p/[id]/quiz/quiz.svelte.ts';

// Re-export presenter state
export { 
	PresenterState, 
	createPresenterState,
	type ConnectionStatus 
} from '$routes/dashboard/[slug]/presenter.svelte.ts';

// Export state management utilities
export function createRootEffect<T>(fn: () => T): { destroy: () => void; value: T } {
	// Create an effect root for managing independent effects
	let cleanup: (() => void) | undefined;
	let value: T;

	const root = $effect.root(() => {
		value = fn();
		return () => {
			if (cleanup) cleanup();
		};
	});

	return {
		destroy: root,
		value: value!
	};
}

// Export state persistence utilities
export function persistState<T>(key: string, state: T): void {
	if (typeof window === 'undefined') return;
	
	$effect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(state));
		} catch (e) {
			console.warn('Failed to persist state:', e);
		}
	});
}

export function restoreState<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;
	
	try {
		const stored = localStorage.getItem(key);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to restore state:', e);
	}
	
	return defaultValue;
}

// Export state reset utility
export function createStateResetter(...states: Array<{ resetState?: () => void; reset?: () => void }>) {
	return () => {
		states.forEach(state => {
			if ('resetState' in state && typeof state.resetState === 'function') {
				state.resetState();
			} else if ('reset' in state && typeof state.reset === 'function') {
				state.reset();
			}
		});
	};
}

// Export reactive computed utility
export function createComputed<T>(compute: () => T): { readonly value: T } {
	const value = $derived(compute());
	return {
		get value() { return value; }
	};
}

// Export batch update utility
export function batchUpdates(updates: Array<() => void>): void {
	// Svelte 5 automatically batches updates, but we can use untrack for optimization
	untrack(() => {
		updates.forEach(update => update());
	});
}

// Export subscription utility for external integrations
export function createSubscription<T>(
	getValue: () => T,
	onChange: (value: T) => void
): () => void {
	let previousValue = getValue();
	
	const cleanup = $effect.root(() => {
		$effect(() => {
			const currentValue = getValue();
			if (currentValue !== previousValue) {
				previousValue = currentValue;
				onChange(currentValue);
			}
		});
	});

	return cleanup;
}