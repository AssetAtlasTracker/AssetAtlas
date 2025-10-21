import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess'

const production = process.env.NODE_ENV === 'production';

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
  }
});