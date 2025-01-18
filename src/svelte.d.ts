//we need this so type script is chill with .svelte files
declare module '*.svelte' {
  export { SvelteComponentDev as default } from 'svelte/internal';
}