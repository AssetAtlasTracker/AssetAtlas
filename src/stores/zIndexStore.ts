import { writable } from 'svelte/store';

export const topZIndex = writable(10);

export function bringToFront(): number {
  let currentTop: number = 0;
  topZIndex.update(val => {
    currentTop = val + 1;
    return currentTop;
  });
  return currentTop;
}
