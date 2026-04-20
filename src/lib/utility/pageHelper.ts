export interface ItemWindow {
	id: string;
	name: string;
	x: number;
	y: number;
}

export function removeItemWindow(itemWindows: ItemWindow[], id: string) {
	return itemWindows.filter(
		(w) => w.id !== id,
	);
}

export function openItemHelper(itemWindows: ItemWindow[], id: string){
	const windowAlreadyExists = itemWindows.find((w) => w.id === id);
	if (windowAlreadyExists) {
		return itemWindows;
	}

	const offset = 30 * itemWindows.length + 50;
	const newItemWindow = { id, name: "Loading...", x: offset, y: offset };
	itemWindows.push(newItemWindow);
	return itemWindows;
}

export function updateTitleHelper(itemWindows: ItemWindow[], windowId: string, event: CustomEvent){
	const { name } = event.detail;
	return itemWindows.map((w) => w.id === windowId ? { ...w, name } : w);
}
