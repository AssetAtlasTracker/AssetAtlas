import { writable } from 'svelte/store';

export const dragAndDropMode = writable<boolean>(false);

export function setDragAndDropMode(enabled: boolean): void {
	dragAndDropMode.set(enabled);
}
