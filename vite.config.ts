import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';

const gitVer = (() => {
	try {
		return execSync('git describe --always --dirty', { encoding: 'utf8' }).trim();
	} catch {
		return 'dev';
	}
})();

const gitVer = (() => {
	try {
		return execSync('git describe --always --dirty', { encoding: 'utf8' }).trim();
	} catch {
		return 'dev';
	}
})();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	define: {
		'import.meta.env.APP_VERSION': JSON.stringify(process.env.APP_VERSION ?? gitVer),
	}
});
