import { query } from '$app/server';

/**
 * Load function for main landing page - can load any public data needed
 */
export const load = query(async () => {
	// For now, return minimal data since this is just a landing page
	// Could be enhanced to load featured sessions, stats, etc.
	return {
		appName: 'Zyeta DX',
		tagline: 'Workplace Experience Platform',
		description:
			"Discover your team's workplace DNA and unlock actionable insights with a clean, fast experience."
	};
});
