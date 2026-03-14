<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { actionStore } from "$lib/stores/actionStore.js";
	import { createEventDispatcher } from "svelte";

	let {
		itemId = $bindable(),
		parentItemName = $bindable(""),
		parentItemId = $bindable<string | null>(null),
		items,
	} = $props<{
		itemId?: string;
		parentItemName?: string;
		parentItemId?: string | null;
		items?: IBasicItemPopulated[];
	}>();
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let suggestions = $state<any[]>([]);

	const dispatch = createEventDispatcher();

	export function setItems(newItems: IBasicItemPopulated[]) {
		items = newItems;
	}

	export function setParent(newParentId: string) {
		parentItemId = newParentId;
	}

	export async function handleMove() {
		if (items && items.length > 0) {
			moveItems();
		} else {
			moveItem();
		}
	}

	async function moveItems() {
		console.log("trying to move items");

		if (!items) {
			return;
		}

		for (let i = 0; i < items.length; i++) {
			itemId = items[i]._id.toString();
			if (!parentItemId || !itemId) {
				return;
			}

			try {
				const response = await fetch(`/api/items/move`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						itemId: itemId,
						newParentId: parentItemId,
					}),
				});
				console.log("Response from moving item: " + response.status);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || "Failed to move item");
				}
				actionStore.addMessage("Item moved successfully");
			} catch (err) {
				console.error("Error moving item:", err);
				actionStore.addMessage("Error moving item");
			}
		}
		dispatch("close");
		location.reload();
	}

	async function moveItem() {
		console.log("trying to move item");
		if (!parentItemId || !itemId) return;

		try {
			const response = await fetch(`/api/items/move`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					itemId: itemId,
					newParentId: parentItemId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to move item");
			}

			actionStore.addMessage("Item moved successfully");
			dispatch("close");
			location.reload();
		} catch (err) {
			console.error("Error moving item:", err);
			actionStore.addMessage("Error moving item");
		}
	}

	async function searchItems(query: string) {
		try {
			const response = await fetch(
				`/api/items/search?name=${encodeURIComponent(query)}`,
			);
			const data = await response.json();
			suggestions = data;
		} catch (err) {
			console.error("Error searching items:", err);
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		parentItemName = target.value;
		parentItemId = null;
		searchItems(parentItemName);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function selectItem(item: any) {
		parentItemName = item.name;
		parentItemId = item._id;
		suggestions = [];
	}
</script>

<div class="flex flex-col space-y-4 p-4">
	<label class="relative">
		New Parent:
		<input
			type="text"
			class="dark-textarea py-2 px-4 w-full"
			bind:value={parentItemName}
			oninput={handleInput} />
		{#if suggestions.length > 0}
			<ul class="small-dialog-suggestions">
				{#each suggestions as item}
					<button
						class="suggestion-item"
						onclick={() => selectItem(item)}>
						{item.name}
					</button>
				{/each}
			</ul>
		{/if}
	</label>

	<button
		class="success-button font-semibold shadow mt-4 w-full block"
		disabled={!parentItemId}
		onclick={handleMove}>
		Move Item
	</button>
</div>
