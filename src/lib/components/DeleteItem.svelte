<script lang="ts">
	import { actionStore } from '$lib/stores/actionStore';

	let {
		itemId,
		onDelete = () => {},
		children
	} = $props<{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		itemId: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onDelete: (itemId: any) => void;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	}>();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function deleteExternalItem(newItem: any) {
		itemId = newItem;
		deleteItem();
	}

	async function deleteItem() {
		try {
			const response = await fetch(`/api/items/${itemId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				onDelete(itemId);
				actionStore.addMessage('Item deleted successfully!');
				//Use the same navigation pattern that ItemContainer uses (IF WE DONT DO THIS THEN POPUP DISAPPEARS)
				window.history.pushState({}, '', '/');
				window.dispatchEvent(new PopStateEvent('popstate'));
			} else {
				console.error("Failed to delete item:", await response.text());
				actionStore.addMessage('Error deleting item');
			}
		} catch (error) {
			console.error("Error deleting item:", error);
			actionStore.addMessage('Error deleting item');
		}
	}
</script>

<button onclick={deleteItem} class="warn-button font-semibold shadow">
	{@render children?.()}
</button>
