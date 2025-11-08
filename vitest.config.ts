import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'node',
		testTimeout: 10000,
		hookTimeout: 10000
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			$routes: '/src/routes'
		}
	}
});