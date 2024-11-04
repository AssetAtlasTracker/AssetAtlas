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
import { fileURLToPath } from 'url';

//env stuff
const production = !process.env.ROLLUP_WATCH;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//env stuff

export default {
  input: 'src/frontend/main.ts',
  output: {
    sourcemap: true,
    //sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: './dist/frontend/bundle.js'
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

    css({ output: 'bundle.css' }),
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),
    typescript({
      verbosity: 3,
      sourceMap: true,
      inlineSources: !production,
      clean: true
      //useTsconfigDeclarationDir: true
    }),
    json(),
    production && terser(),
    copy({
      targets: [
        { src: 'src/frontend/index.html', dest: 'dist/frontend' }
      ],
      copyOnce: true
    })
  ],
  watch: {
    clearScreen: false
  }
};