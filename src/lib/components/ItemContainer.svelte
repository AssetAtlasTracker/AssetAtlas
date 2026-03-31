<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { dragDropMode } from "$lib/stores/dragDropStore.js";
	import { GripVerticalIcon } from "@lucide/svelte";
	import { createEventDispatcher } from "svelte";
	import Dialog from "./Dialog.svelte";
	import ItemCardOptions from "./ItemCardOptions.svelte";
	import MultiActions from "./MultiActions.svelte";

	let {
		items,
		draggingItem = $bindable(),
		targetItemId = $bindable(),
		targetItemName = $bindable(),
		showMoveDialog = $bindable(),
	} = $props<{
		items: IBasicItemPopulated[];
		draggingItem: IBasicItemPopulated | undefined;
		targetItemId: string | undefined;
		targetItemName: string | undefined;
		showMoveDialog: boolean;
	}>();

	let selectedItems = $state<IBasicItemPopulated[]>([]);

	let dialog = $state<HTMLDialogElement | undefined>(undefined);

	let multiActions = $state<MultiActions | undefined>(undefined);
	let itemCardOptions = $state<ItemCardOptions | undefined>(undefined);
	let numSelected = $state(0);

	function handleSelect(item: IBasicItemPopulated) {
		if (selectedItems.includes(item)) {
			deselectItem(item);
		} else {
			selectItem(item);
		}
	}

	function selectItem(item: IBasicItemPopulated) {
		selectedItems.push(item);
		numSelected++;
	}

	function deselectItem(item: IBasicItemPopulated) {
		let index = selectedItems.indexOf(item);
		selectedItems.splice(index, 1);
		numSelected--;
	}

	function selectAll() {
		let checkboxes = document.getElementsByTagName("input");
		for (let i = 0; i < checkboxes.length; i++) {
			checkboxes[i].checked = true;
		}
		selectedItems = items;
		numSelected = items.length;
		console.log(selectedItems);
	}

	function deselectAll() {
		let checkboxes = document.getElementsByTagName("input");
		for (let i = 0; i < checkboxes.length; i++) {
			checkboxes[i].checked = false;
		}
		selectedItems = [];
		numSelected = 0;
		//selected = [];
		console.log(selectedItems);
	}

	function handleDeleteAll() {
		multiActions?.setAction("delete");
		multiActions?.setItems(selectedItems);
		dialog?.showModal();
	}

	function handleMoveAll() {
		multiActions?.setAction("move");
		multiActions?.setItems(selectedItems);
		dialog?.showModal();
	}

	function handleClose() {
		dialog?.close();
		location.reload();
	}

	const dispatch = createEventDispatcher();

	function onCreated() {
		dispatch("itemCreated");
	}

	function handleDragDrop(
		event: DragEvent & { currentTarget: EventTarget & HTMLDivElement },
	) {
		let foundDataContainingElement = false;
		let currentTarget: HTMLElement | null =
			event.currentTarget as HTMLElement | null;
		let maxOut = 10;
		while (!foundDataContainingElement) {
			if (currentTarget) {
				if (currentTarget.draggable) {
					foundDataContainingElement = true;
				} else if (maxOut <= 0) {
					return;
				} else {
					currentTarget = currentTarget.parentElement;
					if (currentTarget === null) {
						return;
					}
					maxOut--;
				}
			} else {
				return;
			}
		}
		targetItemId = currentTarget!.getAttribute("data-item-id");
		targetItemName = currentTarget!.getAttribute("data-item-name");
		if ($dragDropMode && targetItemId && targetItemName && draggingItem) {
			showMoveDialog = true;
			console.log("Successful Drop");
		}
	}

	function handleDragStart(event: DragEvent, item: IBasicItemPopulated) {
		draggingItem = item;
	}

	// Log items to verify data in the frontend
	// svelte-ignore state_referenced_locally
	console.log("Items in frontend:", items);
</script>

{#if items && items.length > 0}
	{#if numSelected > 0}
		<Dialog
			bind:dialog
			isLarge={false}
			close={handleClose}>
			<MultiActions on:close={handleClose} bind:this={multiActions} />
		</Dialog>
		<div class="sort-flex">
			<button
				class="success-button font-semibold shadow mt-4 w-full block"
				onclick={selectAll}>Select All</button>
			<button
				class="success-button font-semibold shadow mt-4 w-full block"
				onclick={deselectAll}>Deselect All</button>
			<button
				class="success-button font-semibold shadow mt-4 w-full block"
				onclick={handleMoveAll}>Move Selected</button>
			<button
				class="warn-button font-semibold shadow mt-4 w-full block"
				onclick={handleDeleteAll}>Delete Selected</button>
		</div>
	{/if}
	<div id="home-component" class="glass page-component">
		{#each items as i (i._id)}
			<div
				class="item-card-flex"
				role="navigation"
				draggable="true"
				ondragstart={(e) => {
					handleDragStart(e, i);
				}}
				ondragover={(e) => {
					e.preventDefault();
				}}
				ondragend={(e) => {
					e.preventDefault();
				}}
				ondrop={handleDragDrop}
				data-item-id={i._id}
				data-item-name={i.name}>
				<input
					type="checkbox"
					style="width: 20px; height: 20px; align-self: center; margin: auto 0;"
					onclick={() => {
						handleSelect(i);
					}} />
				<a href={`/view/${i._id}`} class="item-card">
					<div class="item-subcard flex">
						<div class="grip-vertical-icon">
							<GripVerticalIcon class="icon-small" />
						</div>
						<div>
							<div class="important-text">
								{i.name}
							</div>
							<div class="sub-text">
								{i.description || "No Description"}
							</div>
						</div>
					</div>
					<div class="sub-text item-subcard">
						Location: {i.parentItem?.name || "None"}
					</div>
				</a>
				<ItemCardOptions
					bind:this={itemCardOptions}
					on:mouseenter={() => console.log("mouse entered")}
					item={i}
					on:itemCreated={onCreated} />
			</div>
			<br />
		{/each}
	</div>
{:else}
	<p>No items found.</p>
{/if}
