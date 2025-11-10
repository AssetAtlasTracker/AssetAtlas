import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess'
import { execSync } from 'node:child_process';

const production = process.env.NODE_ENV === 'production';

const gitVer = (() => {
	try {
		return execSync('git describe --always --dirty', { encoding: 'utf8' }).trim();
	} catch {
		return 'dev';
	}
})();

export default defineConfig({
	root: 'src',
	plugins: [
		svelte({
			preprocess: sveltePreprocess(),
			compilerOptions: {
				dev: !production
			}
		})
	],
	build: {
		outDir: '../dist', //Outputs files one level up at project root dist folder
		sourcemap: !production,
		emptyOutDir: false
	},
	server: {
		host: "0.0.0.0",
		port: 3001,
	},
	define: {
		'import.meta.env.APP_VERSION': JSON.stringify(process.env.APP_VERSION ?? gitVer),
	}
});