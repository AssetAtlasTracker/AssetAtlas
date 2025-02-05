// This file is no longer used since we're migrating to esbuild.
// ...existing code...
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import sveltePreprocess from 'svelte-preprocess';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import path from 'path';
import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import { fileURLToPath } from 'url';

//env stuff
const production = !process.env.ROLLUP_WATCH;
// const isProduction = process.env.NODE_ENV === 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//env stuff

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: production ? false : true,
    format: 'iife',
    name: 'app',
    file: './dist/bundle.js'
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.IP': JSON.stringify(process.env.IP),
    }),
    
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        dev: !production
      }
    }),

    css({ output: 'output.css' }),
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),

    postcss({
      extensions: ['.css']
    }),

    commonjs(),
    typescript({
      check: false,
      verbosity: 3,
      sourceMap: !production,
      inlineSources: !production,
      clean: true
      //useTsconfigDeclarationDir: true
    }),
    json(),
    production && terser(),
    copy({
      targets: [
        { src: 'src/index.html', dest: 'dist' }
      ],
      copyOnce: true
    }),
    ...(!production
      ? [
          serve({
            contentBase: 'dist',
            port: 3000, // Local dev server on port 3000
          }),
          livereload('dist'), // Enable live reload
        ]
      : []),

  ],
  watch: {
    clearScreen: false
  }
};