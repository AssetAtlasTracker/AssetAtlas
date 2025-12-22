import { writable } from 'svelte/store';

export const overlayTarget = writable<HTMLElement | null>(null);