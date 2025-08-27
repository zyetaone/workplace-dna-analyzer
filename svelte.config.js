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
		// CSRF protection - allow requests from the app's origin
		csrf: {
			checkOrigin: false // Disable CSRF for remote functions in production
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