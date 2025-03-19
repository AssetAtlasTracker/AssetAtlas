import { writable } from 'svelte/store';

export const topBarHeight = writable<number>(48);

//let top bar update if different
export function setTopBarHeight(height: number): void {
  topBarHeight.set(height);
}
