import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		experimental: {
			remoteFunctions: true
		},
		// Node adapter configuration
		adapter: adapter(),
		
		// Performance optimizations
		serviceWorker: {
			register: false // Disable for real-time apps
		},
	
	},
	compilerOptions: {
		experimental: { async: true }
	}
};

export default config;