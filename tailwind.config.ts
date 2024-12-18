import { join } from 'path';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { customTheme } from './src/customTheme';

const config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{html,js,svelte,ts}',
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],
  theme: {
    extend: {},
  },
  plugins: [
    skeleton({
      themes: { 
        custom: [customTheme] 
      }
    })
  ]
} satisfies Config;

export default config;