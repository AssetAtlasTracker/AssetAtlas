import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const dragDropMode = writable<boolean>(false);

export function setDragDropMode(enabled: boolean): void {
	dragDropMode.set(enabled);

	if (browser) {
		window.localStorage.setItem("dragDropMode", enabled.toString());
	}
}