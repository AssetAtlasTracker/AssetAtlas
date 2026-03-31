import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

const srcRoot = path.resolve('src').replace(/\\/g, '/');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  // enforce runes mode for files in src/ (done this way to exclude files in node modules, etc.)
  vitePlugin: {
    dynamicCompileOptions: ({ filename }) => {
      const normalizedFilename = filename.replace(/\\/g, '/');

      if (normalizedFilename.startsWith(`${srcRoot}/`)) {
        return { runes: true };
      }
    }
  },

  kit: {
    adapter: adapter(),
    alias: {
      $routes: 'src/routes'
    },
    csrf: {
      checkOrigin: false
    }
  }
};

export default config;
