import { writable } from 'svelte/store';

export const dragDropMode = writable<boolean>(false);

export function setDragDropMode(enabled: boolean): void {
	dragDropMode.set(enabled);
	window.localStorage.setItem("dragDropMode", enabled.toString());
}
