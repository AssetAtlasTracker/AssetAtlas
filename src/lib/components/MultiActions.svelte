<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { createEventDispatcher } from "svelte";
	import DeleteItem from "./DeleteItem.svelte";
	import Dialog from "./Dialog.svelte";
	import MoveItem from "./MoveItem.svelte";

	const dispatch = createEventDispatcher();
	let action = $state("");
	let items = $state<IBasicItemPopulated[]>([]);
	let deleter = $state<DeleteItem | undefined>(undefined);
	let mover = $state<MoveItem | undefined>(undefined);

	let dialog = $state<HTMLDialogElement | undefined>(undefined);

	export function setAction(newAction: string) {
		action = newAction;
	}

	export function setItems(newItems: IBasicItemPopulated[]) {
		items = newItems;
	}

	function handleAction() {
		if (action == "delete") {
			for (let i = 0; i < items.length; i++) {
				console.log(items[i]);
				deleter?.deleteExternalItem(items[i]._id);
			}
			dispatch("close");
			dialog?.close();
		}
	}
</script>

{#if action == "move"}
	<MoveItem itemId="" {items} bind:this={mover} />
{:else}
	<button
		class="success-button font-semibold shadow mt-4 w-full block"
		onclick={handleAction}>
		Are you sure you want to {action} these items?
	</button>
	<Dialog
		bind:dialog
		isLarge={false}
		close={() => dialog?.close()}
	><DeleteItem itemId="" bind:this={deleter} />
	</Dialog>
{/if}
