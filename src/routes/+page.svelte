<script lang="ts">
	import CreateItem from "$lib/components/CreateItem.svelte";
	import DeleteItem from "$lib/components/DeleteItem.svelte";
	import Dialog from "$lib/components/Dialog.svelte";
	import EditItem from "$lib/components/EditItem.svelte";
	import ItemContainer from "$lib/components/ItemContainer.svelte";
	import ItemDetails from "$lib/components/ItemDetails.svelte";
	import ItemTree from "$lib/components/ItemTree.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import MoveItem from "$lib/components/MoveItem.svelte";
	import ReturnItem from "$lib/components/ReturnItem.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import Window from "$lib/components/Window.svelte";
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import {
		dragDropMode,
		setDragDropMode,
	} from "$lib/stores/dragDropStore.js";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import { getEditOnLogin, login } from "$lib/stores/loginStore.js";
	import { topBarHeight } from "$lib/stores/topBarStore.js";
	import "$lib/styles/main.css";
	import { Switch } from "@skeletonlabs/skeleton-svelte";
	import { onDestroy, onMount } from "svelte";

	export let searchQuery = "";
	export let dialog: HTMLDialogElement;
	export let menu: HTMLDialogElement;

	let searchResults: IBasicItemPopulated[] = [];
	let sortOption: string = "alphabetical";
	let exactSearch = false;
	let viewMode: "list" | "tree" = "list";
	$: showItemTree = viewMode === "tree";

	let itemCount = -1;

	let draggingItem: IBasicItemPopulated | undefined = undefined;
	let targetItemId: string | undefined = undefined;
	let targetItemName: string | undefined = undefined;
	let showMoveDialog: boolean = false;
	let moveDialog: HTMLDialogElement;

	let actionMoveDialog: HTMLDialogElement | undefined;
	let actionReturnDialog: HTMLDialogElement | undefined;
	let actionEditDialog: HTMLDialogElement | undefined;
	let actionDeleteDialog: HTMLDialogElement | undefined;

	let actionItem: IBasicItemPopulated | null = null;
	let actionItemId: string | null = null;
	let actionHomeItemId: string | null = null;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let actionParentItemId: string | null = null;
	let actionItemName = "";

	let itemTreeRef: { reload: () => Promise<void> } | null = null;

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	$: {
		if (showMoveDialog) {
			moveDialog.showModal();
		}
	}

	$: {
		if (moveDialog) {
			moveDialog.onclose = () => {
				showMoveDialog = false;
			};
		}
	}

	async function handleSortChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		sortOption = target.value;
		await handleSearch(searchQuery);
	}

	async function handleSearch(query: string) {
		searchQuery = query;
		try {
			const response = await fetch(
				`/api/items/search?` +
					`name=${encodeURIComponent(searchQuery)}&` +
					`sort=${encodeURIComponent(sortOption)}&` +
					`exact=${exactSearch.toString()}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (!response.ok) throw new Error("Failed to fetch items");

			const data = await response.json();
			searchResults = data as IBasicItemPopulated[];
			itemCount = searchResults.length;
			if (showItemTree && itemTreeRef) {
				await itemTreeRef.reload();
			}
		} catch (err) {
			console.error("Home: Error searching items:", err);
		}
	}

	function toggleView() {
		if (viewMode === "list") {
			viewMode = "tree";
		} else {
			viewMode = "list";
		}
		window.localStorage.setItem("viewMode", viewMode);
	}

	function restoreToggleStates() {
		const savedViewMode = window.localStorage.getItem("viewMode");
		if (savedViewMode != null) {
			viewMode = savedViewMode === "tree" ? "tree" : "list";
		}

		const savedDragDropMode = window.localStorage.getItem("dragDropMode");
		if (savedDragDropMode != null) {
			const dragDropMode = savedDragDropMode === "true" ? true : false;
			setDragDropMode(dragDropMode);
		}
	}

	interface ItemWindow {
		id: string;
		name: string;
		x: number;
		y: number;
	}

	let additionalItemWindows: ItemWindow[] = [];

	function handleOpenItem(event: CustomEvent) {
		const { id } = event.detail;

		const existingWindow = additionalItemWindows.find((w) => w.id === id);
		if (existingWindow) {
			return;
		}

		const offsetX = 50 + additionalItemWindows.length * 30;
		const offsetY = 50 + additionalItemWindows.length * 30;

		additionalItemWindows = [
			...additionalItemWindows,
			{ id, name: "Loading...", x: offsetX, y: offsetY },
		];
	}

	function handleUpdateTitle(windowId: string, event: CustomEvent) {
		const { name } = event.detail;
		additionalItemWindows = additionalItemWindows.map((w) =>
			w.id === windowId ? { ...w, name } : w,
		);
	}

	function handleCloseWindow(id: string) {
		additionalItemWindows = additionalItemWindows.filter(
			(w) => w.id !== id,
		);
	}

	const handleShowActionDialog = (
		detail: {
			item: IBasicItemPopulated | null;
			itemId: string | null;
			homeItemId: string | null;
			parentItemId: string | null;
			itemName: string;
		},
		dialog: HTMLDialogElement | undefined,
	) => {
		actionItem = detail.item;
		actionItemId = detail.itemId;
		actionHomeItemId = detail.homeItemId;
		actionParentItemId = detail.parentItemId;
		actionItemName = detail.itemName;

		dialog?.showModal();
	};

	function openInNewTab(itemId: string) {
		window.open(`/view/${itemId}`, "_blank");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let currentTopBarHeight: number = 0;

	let unsubscribe: () => void = () => {};

	onMount(() => {
		document.title = "Home - AssetAtlas";
		restoreToggleStates();
		unsubscribe = topBarHeight.subscribe((value) => {
			currentTopBarHeight = value;
		});
	});

	onDestroy(() => {
		unsubscribe();
	});

	function handleTreeClose() {
		toggleView();
	}
</script>

<TopBar
	bind:searchQuery
	bind:menu
	bind:exactSearch
	onSearch={(query) => {
		handleSearch(query);
	}}
	onExactSearchChange={(_value) => {
		handleSearch(searchQuery);
	}} />

<div class="view-layout page-with-topbar">
	<Menu bind:menu />

	<div class="sort-flex">
		<div class="simple-flex items-center">
			{#if viewMode === "list"}
				<div class="sort-container custom-dropdown">
					<label for="sort"></label>
					<select
						id="sort"
						bind:value={sortOption}
						on:change={handleSortChange}>
						<option value="alphabetical">A-Z</option>
						<option value="lastAdded">Newest</option>
						<option value="firstAdded">Oldest</option>
					</select>
				</div>
			{/if}

			<Switch
				checked={showItemTree}
				onchange={(_e) => {
					showItemTree = !showItemTree;
					toggleView();
				}}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>Tree View</Switch.Label>
				<Switch.HiddenInput />
			</Switch>

			<Switch
				checked={$dragDropMode}
				onchange={(_e) => {
					setDragDropMode(!$dragDropMode);
				}}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>Drag and Drop Mode</Switch.Label>
				<Switch.HiddenInput />
			</Switch>
		</div>
	</div>

	{#if viewMode === "list"}
		{#if itemCount > 0}
			<ItemContainer
				items={searchResults}
				on:itemCreated={() => handleSearch(searchQuery)}
				bind:showMoveDialog
				bind:draggingItem
				bind:targetItemId
				bind:targetItemName />
		{:else if itemCount == 0}
			<div id="home-component" class="page-component glass">
				<p class="text-center important-text">No Items Found</p>
				<br />
				<p class="text-center">
					Add new items using the + button in the bottom right.
				</p>
				<p class="text-center">
					Or import bulk items using the menu in the top left.
				</p>
				<br />
				<p class="text-center">
					If you are expecting items to be here, you may need to
					refresh the page.
				</p>
			</div>
		{:else}
			<div id="home-component" class="page-component glass">
				<p class="text-center important-text">Loading Items...</p>

				<br />
				<div class="placeholder animate-pulse"></div>
				<br />

				<p class="text-center sub-text">
					If loading takes longer than expected, you may need to
					refresh the page.
				</p>
			</div>
		{/if}
	{:else if showItemTree}
		<Window
			initialX={32}
			initialY={64}
			windowTitle="Item Tree"
			windowClass="page-component"
			showClose={true}
			showOpenInNewTab={false}
			showCollapse={true}
			on:close={handleTreeClose}>
			<ItemTree
				bind:this={itemTreeRef}
				bind:draggingItem
				bind:targetItemId
				bind:targetItemName
				bind:showMoveDialog
				{searchQuery}
				{exactSearch}
				useWindowView={true}
				on:openItem={handleOpenItem} />
		</Window>

		{#each additionalItemWindows as window (window.id)}
			<Window
				initialX={window.x}
				initialY={window.y}
				windowTitle="Item View: {window.name}"
				windowClass="page-component"
				showClose={true}
				showOpenInNewTab={true}
				showCollapse={true}
				on:close={() => handleCloseWindow(window.id)}
				on:openNewTab={() => openInNewTab(window.id)}>
				<ItemDetails
					item={null}
					itemId={window.id}
					onMove={(detail) =>
						handleShowActionDialog(detail, actionMoveDialog)}
					onReturn={(detail) =>
						handleShowActionDialog(detail, actionReturnDialog)}
					onEdit={(detail) =>
						handleShowActionDialog(detail, actionEditDialog)}
					onDelete={(detail) =>
						handleShowActionDialog(detail, actionDeleteDialog)}
					on:openItem={handleOpenItem}
					on:updateTitle={(e) => handleUpdateTitle(window.id, e)} />
			</Window>
		{/each}
	{/if}

	{#if !getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)}
		<button
			class="add-button text-icon font-bold shadow"
			on:click={() => {
				if (dialog) dialog.showModal();
			}}>
			+
		</button>
	{/if}
	<CreateItem
		bind:dialog
		duplicate={false}
		on:itemCreated={() => {
			handleSearch(searchQuery);
		}} />
</div>

{#if draggingItem}
	<Dialog
		bind:dialog={moveDialog}
		isLarge={false}
		create={() => {
			moveDialog.showModal();
		}}
		close={() => {
			showMoveDialog = false;
		}}>
		<div class="important-text text-center">
			Move "{draggingItem.name}" to:
		</div>
		<MoveItem
			itemId={draggingItem._id.toString()}
			parentItemName={targetItemName}
			parentItemId={targetItemId}
			items={undefined}
			on:close={() => {
				showMoveDialog = false;
			}} />
	</Dialog>
{/if}

<Dialog
	bind:dialog={actionDeleteDialog}
	isLarge={false}
	create={() => {}}
	close={() => actionDeleteDialog?.close()}>
	<div class="simple-dialog-spacing">
		Are you sure you want to delete {actionItemName || "this item"}?
	</div>
	<DeleteItem
		itemId={actionItemId ?? undefined}
		onDelete={() => actionDeleteDialog?.close()}>Delete</DeleteItem>
</Dialog>

<Dialog
	bind:dialog={actionReturnDialog}
	isLarge={false}
	create={() => {}}
	close={() => actionReturnDialog?.close()}>
	<div class="simple-dialog-spacing">
		Are you sure you want to return {actionItemName || "this item"} to its home
		location?
	</div>
	<ReturnItem
		itemId={actionItemId ?? undefined}
		parentId={actionHomeItemId ?? undefined}>
		Return to home
	</ReturnItem>
</Dialog>

<Dialog
	bind:dialog={actionEditDialog}
	isLarge={false}
	create={() => {}}
	close={() => actionEditDialog?.close()}>
	{#if actionItem}
		<EditItem
			item={actionItem}
			on:close={() => actionEditDialog?.close()}
			on:itemUpdated={() => {}} />
	{:else}
		<div class="simple-dialog-spacing">Loading item data...</div>
	{/if}
</Dialog>

<Dialog
	bind:dialog={actionMoveDialog}
	isLarge={false}
	create={() => {}}
	close={() => actionMoveDialog?.close()}>
	<div class="important-text text-center">
		Move "{actionItemName || "this item"}" to:
	</div>
	<MoveItem
		itemId={actionItemId ?? undefined}
		parentItemName={undefined}
		parentItemId={undefined}
		items={undefined}
		on:close={() => actionMoveDialog?.close()} />
</Dialog>
