import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

const production = process.env.NODE_ENV === 'production';

export default defineConfig({
  root: 'src',
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: { dev: !production }
    })
  ],
  build: {
    outDir: '../dist',
    sourcemap: !production,
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
  }
  // Removed test config from here.
});
