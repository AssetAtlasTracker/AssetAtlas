import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		testTimeout: 10000,
		hookTimeout: 10000,
		projects: [
			{
				test: {
					name: 'components',
					include: ['tests/components/**/*.{test,spec}.{js,ts}'],
					environment: 'jsdom',
					globals: true
				},
				plugins: [sveltekit()],
				resolve: {
					conditions: ['browser'],
					alias: {
						$lib: '/src/lib',
						$routes: '/src/routes'
					}
				}
			},
			{
				test: {
					name: 'server',
					include: ['tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['tests/components/**', 'tests/performance.test.ts'],
					environment: 'node',
					globals: true
				},
				plugins: [sveltekit()],
				resolve: {
					alias: {
						$lib: '/src/lib',
						$routes: '/src/routes'
					}
				}
			},
			{
				test: {
					name: 'performance',
					include: ['tests/performance.test.ts'],
					environment: 'node',
					globals: true
				},
				plugins: [sveltekit()],
				resolve: {
					alias: {
						$lib: '/src/lib',
						$routes: '/src/routes'
					}
				}
			}
		]
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			$routes: '/src/routes'
		}
	}
});
