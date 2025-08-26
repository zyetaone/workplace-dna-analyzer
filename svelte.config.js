import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		experimental:{
			remoteFunctions: true
		},
		// Node adapter configuration
		adapter: adapter(),
		// WebSocket support configuration
		csrf: {
			trustedOrigins: ['*'] // Required for WebSocket connections
		},
		// Performance optimizations
		serviceWorker: {
			register: false // Disable for real-time apps
		},
		prerender: {
			entries: [] // Disable prerendering for dynamic app
		}
	},
	compilerOptions: {
		experimental: { async: true }
	}
};

export default config;