import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { UserConfigExport } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  root: '.',
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      '/api':{
        target: 'http://assetatlas:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: './index.html',
    },
  },
  
  test: {
    globals: true, // This makes functions like `beforeAll`, `describe`, etc., available globally
    environment: 'node', // Use Node environment if working on server-side code
  },
} as UserConfigExport);