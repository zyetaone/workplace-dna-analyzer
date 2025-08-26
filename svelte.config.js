import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		experimental:{
			remoteFunctions: true
		},
		// Node adapter configuration
		adapter: adapter({
			out: 'build',
			precompress: true,
			envPrefix: 'APP_',
			polyfill: false // We're using modern Node
		}),
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