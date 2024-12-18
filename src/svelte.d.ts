//we need this so type script is chill with .svelte files
declare module '*.svelte' {
  import { SvelteComponentTyped } from 'svelte';
  export default class SvelteComponent<
    T = Record<string, unknown>,
    U = Record<string, unknown>,
    V = Record<string, unknown>
  > extends SvelteComponentTyped<T, U, V> {}
}