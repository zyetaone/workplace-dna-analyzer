/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
		environment: 'jsdom',
		setupFiles: ['./src/lib/test-utils/setup.ts'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/lib/test-utils/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/coverage/**',
				'**/dist/**',
				'**/*.stories.svelte'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		},
		globals: true
	},
	resolve: {
		alias: {
			$lib: resolve(__dirname, 'src/lib'),
			$app: resolve(__dirname, 'src/app')
		}
	}
});
