<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import CreateItem from "$lib/components/CreateItem.svelte";
	import DeleteItem from "$lib/components/DeleteItem.svelte";
	import Dialog from "$lib/components/Dialog.svelte";
	import EditItem from "$lib/components/EditItem.svelte";
	import ItemDetails from "$lib/components/ItemDetails.svelte";
	import ItemTree from "$lib/components/ItemTree.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import MoveItem from "$lib/components/MoveItem.svelte";
	import ReturnItem from "$lib/components/ReturnItem.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import Window from "$lib/components/Window.svelte";
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import { getEditOnLogin } from "$lib/stores/loginStore.js";
	import type { PageData } from "./$types";

	let {
		data,
		createDialog = $bindable(),
	}: {
		data: PageData;
		createDialog: HTMLDialogElement;
	} = $props();

	let item = $derived(data.item);
	let targetItem = $state<IBasicItemPopulated | null>(null);
	let editDialog = $state<HTMLDialogElement | undefined>();
	let deleteDialog = $state<HTMLDialogElement | undefined>();
	let returnDialog = $state<HTMLDialogElement | undefined>();
	let moveDialog = $state<HTMLDialogElement | undefined>();
	let menu = $state<HTMLDialogElement | undefined>();
	let unique = $state({});
	let showItemTree = $state(true);
	let itemTree = $state<{ reload: () => Promise<void> } | null>(null);
	let mainItemDetails = $state<{ reload: () => Promise<void> } | null>(null);
	let draggingItem = $state<IBasicItemPopulated | null>(null);
	let targetItemId = $state<string | undefined>(undefined);
	let targetItemName = $state<string | undefined>(undefined);
	let currentLogin = $state<LoginState | undefined>();

	$effect(() => {
		if (browser && item) {
			document.title = item.name + " - AssetAtlas";
		}
	});

	function handleTreeClose() {
		showItemTree = false;
	}

	function restart() {
		unique = {};
	}

	async function refreshAdditionalItemWindows() {
		await Promise.all(
			additionalWindows.map(
				(windowItem) => windowItem.detailsRef?.reload() ?? Promise.resolve(),
			),
		);
	}

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
			if (showItemTree) {
				await itemTree?.reload();
			}
			await mainItemDetails?.reload();
			await refreshAdditionalItemWindows();
		} catch (err) {
			console.error(err);
			item = null;
		}
	}

	let availableItems = $state<IBasicItemPopulated[]>([]);

	function handleDelete() {
		deleteDialog?.close();
		goto(resolve("/"));
	}

	function onSearch(_query: string) {}

	//Track additional item windows
	interface ItemWindow {
		id: string;
		name: string;
		x: number;
		y: number;
		detailsRef: { reload: () => Promise<void> } | null;
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

		additionalWindows = [
			...additionalWindows,
			{ id, name: "Loading...", x: offsetX, y: offsetY, detailsRef: null },
		];
	}

	function handleUpdateTitle(windowId: string, event: CustomEvent) {
		const { name } = event.detail;
		additionalWindows = additionalWindows.map((w) =>
			w.id === windowId ? { ...w, name } : w,
		);
	}

	function handleCloseWindow(id: string) {
		additionalWindows = additionalWindows.filter((w) => w.id !== id);
	}

	function openInNewTab(itemId: string) {
		if (browser) {
			window.open(`/view/${itemId}`, "_blank");
		}
	}

	interface EditDetail {
		item: IBasicItemPopulated | null;
		itemId: string | null;
	}

	async function fetchItemForTarget(id: string): Promise<IBasicItemPopulated | null> {
		try {
			const response = await fetch(`/api/items/${id}`);
			if (!response.ok) return null;
			return (await response.json()) as IBasicItemPopulated;
		} catch (err) {
			console.error("Failed to fetch item for target:", err);
			return null;
		}
	}

	//want to refactor so target item is set for all these dialogs
	const loadItem = async (detail: EditDetail): Promise<boolean> => {
		if (detail.item) {
			targetItem = detail.item;
			return true;
		}

		if (!detail.itemId) return false;

		const loadedItem = await fetchItemForTarget(detail.itemId);
		if (!loadedItem) return false;

		targetItem = loadedItem;
		return true;
	};

	const showMoveDialog = async (detail: EditDetail) => {
		const hasTarget = await loadItem(detail);
		if (!hasTarget) return;
		if (!moveDialog) return;
		moveDialog.showModal();
	};
	const showReturnDialog = async (detail: EditDetail) => {
		const hasTarget = await loadItem(detail);
		if (!hasTarget) return;
		if (!returnDialog) return;
		returnDialog.showModal();
	};
	const showEditDialog = async (detail: EditDetail) => {
		const hasTarget = await loadItem(detail);
		if (!hasTarget) return;
		if (!editDialog) return;
		editDialog?.showModal();
	};
	const showDeleteDialog = async (detail: EditDetail) => {
		const hasTarget = await loadItem(detail);
		if (!hasTarget) return;
		if (!deleteDialog) return;
		deleteDialog.showModal();
	};
</script>

<!-- Rest of your template stays the same -->
<TopBar searchQuery="" {onSearch} {menu} />
<Menu bind:menu />

{#if item}
	<div class="view-layout page-with-topbar">
		<Window
			initialX={32}
			initialY={32}
			windowTitle={item ? `Item Details: ${item.name}` : "Item Details"}
			windowClass="page-component"
			showClose={false}
			showOpenInNewTab={false}
			showCollapse={true}>
			<ItemDetails
				{item}
				bind:this={mainItemDetails}
				bind:showItemTree
				onMove={showMoveDialog}
				onReturn={showReturnDialog}
				onEdit={showEditDialog}
				onDelete={showDeleteDialog}
				on:openItem={handleOpenItem} />
		</Window>

		{#if showItemTree && item}
			<Window
				initialX={400 + 32}
				initialY={16}
				windowTitle="Item Tree"
				windowClass="page-component"
				showClose={true}
				showOpenInNewTab={false}
				showCollapse={true}
				on:close={handleTreeClose}>
				<ItemTree
					bind:this={itemTree}
					parentId={item._id.toString()}
					currentId={item._id.toString()}
					{draggingItem}
					{targetItemId}
					{targetItemName}
					showMoveDialog={false}
					useWindowView={true}
					on:openItem={handleOpenItem} />
			</Window>
		{/if}

		{#each additionalWindows as itemWindow (itemWindow.id)}
			<Window
				initialX={itemWindow.x}
				initialY={itemWindow.y}
				windowTitle="Item View: {itemWindow.name}"
				windowClass="page-component"
				showClose={true}
				showOpenInNewTab={true}
				showCollapse={true}
				on:close={() => handleCloseWindow(itemWindow.id)}
				on:openNewTab={() => openInNewTab(itemWindow.id)}>
				<ItemDetails
					item={null}
					itemId={itemWindow.id}
					bind:this={itemWindow.detailsRef}
					bind:showItemTree
					onMove={showMoveDialog}
					onReturn={showReturnDialog}
					onEdit={showEditDialog}
					onDelete={showDeleteDialog}
					on:openItem={handleOpenItem}
					on:updateTitle={(e) =>
						handleUpdateTitle(itemWindow.id, e)} />
			</Window>
		{/each}
	</div>
{:else}
	<p>Loading item data...</p>
{/if}

<Dialog
	canOverflow={false}
	bind:dialog={deleteDialog}
	isLarge={false}
	create={() => {}}
	close={() => {
		deleteDialog?.close();
		targetItem = null;
	}}>
	<div class="simple-dialog-spacing">
		Are you sure you want to delete {targetItem?.name ?? item?.name}?
	</div>
	<DeleteItem itemId={targetItem?._id?.toString()} onDelete={handleDelete}
	>Delete</DeleteItem>
</Dialog>

<Dialog
	canOverflow={false}
	bind:dialog={returnDialog}
	isLarge={false}
	create={() => {}}
	close={() => {
		returnDialog?.close();
		targetItem = null;
	}}>
	<div class="simple-dialog-spacing">
		Are you sure you want to return {targetItem?.name ?? item?.name} to its home location?
	</div>
	<ReturnItem itemId={targetItem?._id?.toString()} parentId={targetItem?.homeItem?._id?.toString()}>
		Return to home
	</ReturnItem>
</Dialog>

{#if targetItem}
	<Dialog
		canOverflow={false}
		bind:dialog={editDialog}
		isLarge={false}
		create={() => {}}
		close={() => {
			editDialog?.close();
			targetItem = null;
		}}>
		<EditItem
			item={targetItem}
			on:close={() => {
				editDialog?.close();
				targetItem = null;
			}}
			on:itemUpdated={() => {
				if (data.item?._id && targetItem?._id && data.item._id.toString() === targetItem._id.toString()) {
					fetchItem(data.item._id.toString());
				}
			}} />
	</Dialog>
{/if}

<Dialog
	canOverflow={false}
	bind:dialog={moveDialog}
	isLarge={false}
	create={() => {}}
	close={() => {
		moveDialog?.close();
		targetItem = null;
	}}>
	<div class="important-text text-center">
		Move "{targetItem?.name ?? item?.name}" to:
	</div>
	<MoveItem
		itemId={targetItem?._id?.toString()}
		items={availableItems}
		on:close={() => {
			moveDialog?.close();
			targetItem = null;
			if (browser) {
				location.reload();
			}
		}} />
</Dialog>



{#if !getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)}
	<button
		class="add-button text-icon font-bold shadow"
		onclick={() => createDialog?.showModal()}>
		+
	</button>
{/if}

{#key unique}
	<CreateItem
		bind:dialog={createDialog}
		on:close={() => createDialog?.close()}
		on:itemCreated={() =>
			data.item?._id && fetchItem(data.item._id.toString())} />
{/key}
