<script lang="ts">
	import ItemDetails from "$lib/components/ItemDetails.svelte";
	import DeleteItem from "$lib/components/DeleteItem.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import Dialog from "$lib/components/Dialog.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import ItemTree from "$lib/components/ItemTree.svelte";
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import ReturnItem from "$lib/components/ReturnItem.svelte";
	import CreateItem from "$lib/components/CreateItem.svelte";
	import EditItem from "$lib/components/EditItem.svelte";
	import MoveItem from "$lib/components/MoveItem.svelte";
	import Window from "$lib/components/Window.svelte";
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import { resolve } from "$app/paths";
  
	let { data }: { data: PageData } = $props();
	let item = $state(data.item);

	let editDialog = $state<HTMLDialogElement | undefined>();
	let deleteDialog = $state<HTMLDialogElement | undefined>();
	let createDialog = $state<HTMLDialogElement | undefined>();
	let returnDialog = $state<HTMLDialogElement | undefined>();
	let moveDialog = $state<HTMLDialogElement | undefined>();
	let menu = $state<HTMLDialogElement | undefined>();

	let unique = $state({});
	function restart() {
		unique = {};
	}

	let showItemTree = $state(true);

	// Add state for ItemTree props
	let draggingItem = $state<IBasicItemPopulated | null>(null);
	let targetItemId = $state<string | undefined>(undefined);
	let targetItemName = $state<string | undefined>(undefined);

	function handleTreeClose() {
		showItemTree = false;
	}

	// Update document title when item changes
	$effect(() => {
		if (browser && item) {
			document.title = item.name + " - AssetAtlas";
		}
	});

	async function fetchItem(id: string) {
		try {
			const response = await fetch(`/api/items/${id}`);

			if (!response.ok) {
				throw new Error(
					`Failed to fetch item: ${response.status} ${response.statusText}`,
				);
			}
			const data: IBasicItemPopulated = await response.json();
			item = data;
			restart();
		} catch (err) {
			console.error(err);
			item = null;
		}
	}

	let availableItems = $state<IBasicItemPopulated[]>([]);
    

	function handleDelete() {
		deleteDialog?.close();
		goto(resolve('/'));
	}

	function onSearch(query: string) {}

	//Track additional item windows
	interface ItemWindow {
		id: string;
		x: number;
		y: number;
	}

	let additionalWindows = $state<ItemWindow[]>([]);

	function handleOpenItem(event: CustomEvent) {
		const { id } = event.detail;

		//Dont open a new window if the item is already the main item
		if (id === data.item?._id) {
			return;
		}

		//Check if the window for this item already exists
		const existingWindow = additionalWindows.find((w) => w.id === id);
		if (existingWindow) {
			return;
		}

		const offsetX = 50 + additionalWindows.length * 30;
		const offsetY = 50 + additionalWindows.length * 30;

		additionalWindows = [...additionalWindows, { id, x: offsetX, y: offsetY }];
	}

	function handleCloseWindow(id: string) {
		additionalWindows = additionalWindows.filter((w) => w.id !== id);
	}

	function openInNewTab(itemId: string) {
		if (browser) {
			window.open(`/view/${itemId}`, "_blank");
		}
	}
</script>

<!-- Rest of your template stays the same -->
<TopBar searchQuery="" {onSearch} {menu} />
<Menu bind:menu />

{#if item}
	<div class="view-layout page-with-topbar">
		<Window
			initialX={32}
			initialY={32}
			windowTitle="Item Details"
			windowClass="page-component"
			showClose={false}
			showOpenInNewTab={false}
		>
			<ItemDetails 
				{item} 
				bind:moveDialog
				bind:returnDialog
				bind:editDialog
				bind:deleteDialog
				bind:showItemTree
				on:openItem={handleOpenItem} 
			/>

			
		</Window>

		{#if showItemTree && item}
			<Window
				initialX={400 + 32}
				initialY={16}
				windowTitle="Item Tree"
				windowClass="page-component"
				showClose={true}
				showOpenInNewTab={false}
				on:close={handleTreeClose}
			>
				<ItemTree
					parentId={item._id.toString()}
					currentId={item._id.toString()}
					{draggingItem}
					{targetItemId}
					{targetItemName}
					showMoveDialog={false}
					useWindowView={true}
					on:openItem={handleOpenItem}
				/>
			</Window>
		{/if}

		{#each additionalWindows as itemWindow (itemWindow.id)}
			<Window
				initialX={itemWindow.x}
				initialY={itemWindow.y}
				windowTitle="Item View"
				windowClass="page-component"
				showClose={true}
				showOpenInNewTab={true}
				on:close={() => handleCloseWindow(itemWindow.id)}
				on:openNewTab={() => openInNewTab(itemWindow.id)}
			>
				<ItemDetails
					item={null}
					itemId={itemWindow.id}
					on:openItem={handleOpenItem}
				/>
			</Window>
		{/each}
	</div>
{:else}
	<p>Loading item data...</p>
{/if}

<Dialog
	bind:dialog={deleteDialog}
	on:close={() => {
		deleteDialog?.close();
	}}
>
	<div class="simple-dialog-spacing">
		Are you sure you want to delete {item?.name}?
	</div>
	<DeleteItem itemId={data.item?._id} onDelete={handleDelete}>Delete</DeleteItem>
</Dialog>

<Dialog
	bind:dialog={returnDialog}
	on:close={() => {
		returnDialog?.close();
	}}
>
	<div class="simple-dialog-spacing">
		Are you sure you want to return {item?.name} to its home location?
	</div>
	<ReturnItem itemId={data.item?._id} parentId={item?.homeItem?._id}>
		Return to home
	</ReturnItem>
</Dialog>

{#if item}
	<Dialog
		bind:dialog={editDialog}
		on:close={() => {
			editDialog?.close();
		}}
	>
		<EditItem
			{item}
			on:close={() => {
				editDialog?.close();
			}}
			on:itemUpdated={() => {
				if (data.item?._id) {
					fetchItem(data.item._id.toString());
				}
			}}
		/>
	</Dialog>
{/if}

<Dialog
	bind:dialog={moveDialog}
	on:close={() => {
		moveDialog?.close();
	}}
>
	<div class="important-text text-center">
		Move "{item?.name}" to:
	</div>
	<MoveItem
		itemId={data.item?._id.toString()}
		items={availableItems}
		on:close={() => {
			moveDialog?.close();
			if (browser) {
				location.reload();
			}
		}}
	/>
</Dialog>

<button
	class="add-button text-icon font-bold shadow"
	on:click={() => createDialog?.showModal()}
>
	+
</button>

{#key unique}
	{#if createDialog}
		<CreateItem
			bind:dialog={createDialog}
			{item}
			duplicate={false}
			on:close={() => createDialog?.close()}
			on:itemCreated={() => data.item?._id && fetchItem(data.item._id.toString())}
		/>
	{/if}
{/key}