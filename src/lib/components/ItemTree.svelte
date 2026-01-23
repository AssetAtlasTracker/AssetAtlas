<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { dragDropMode } from "$lib/stores/dragDropStore.js";
	import { onDestroy, onMount } from "svelte";
	import ItemLink from "./ItemLink.svelte";

	interface TreeItem {
		_id: string;
		name: string;
		description?: string;
		children: TreeItem[];
		hasChildren: boolean;
	}

	export let searchQuery: string = "";
	export let exactSearch: boolean = false;

	export let draggingItem: IBasicItemPopulated | null | undefined;
	export let targetItemId: string | undefined;
	export let targetItemName: string | undefined;
	export let showMoveDialog: boolean;
	let currentDragDropMode: boolean;

	const dragDropUnsubscribe = dragDropMode.subscribe((value) => {
		currentDragDropMode = value;
	});

	export function closeMoveDialog() {
		showMoveDialog = false;
	}

	export let useWindowView = false;
	export let parentId: string | null = null;
	export let indentLevel: number = 0;
	export let rootData: TreeItem[] | null = null;
	export let currentId: string | null = null;

	let treeData: TreeItem[] = [];
	let expanded: Record<string, boolean> = {};
	let loading = true;

	async function fetchTree(id?: string) {
		try {
			const url = id ? `/api/items/tree/${id}` : `/api/items/tree/all`;
			const params = new URLSearchParams();
			if (searchQuery && searchQuery.trim() !== "") {
				params.set("name", searchQuery);
				params.set("exact", exactSearch.toString());
			}
			const fullUrl = params.toString() ? `${url}?${params}` : url;
			const res = await fetch(fullUrl);
			if (!res.ok) throw new Error("Failed to fetch tree data");
			const data = await res.json();
			return Array.isArray(data) ? data : [data];
		} catch (err) {
			console.error("Error fetching tree:", err);
			return [];
		}
	}

	export async function reload() {
		await loadTree();
	}

	async function loadTree() {
		loading = true;
		if (rootData) {
			treeData = rootData;
		} else {
			treeData = await fetchTree(parentId || undefined);
		}
		loading = false;
		autoExpandTree(treeData);
	}

	function toggleExpand(id: string) {
		expanded[id] = !expanded[id];
		expanded = expanded;
	}

	function autoExpandTree(items: TreeItem[]) {
		if (items.length === 1) {
			const item = items[0];
			if (item.hasChildren && item.children && item.children.length > 0) {
				expanded[item._id] = true;
				autoExpandTree(item.children);
			}
		}
	}

	function ensureString(id: any): string {
		if (!id) return "";
		return typeof id === "string" ? id : id.toString();
	}

	onMount(() => {
		loadTree();
	});

	$: if (parentId) {
		loadTree();
	}

	function checkIfSwap() {
		if (
			currentDragDropMode &&
			targetItemId &&
			draggingItem &&
			targetItemId != (draggingItem._id as unknown as string)
		) {
			showMoveDialog = true;
		}
	}

	function doDrop(e: Event) {
		e.preventDefault();
		let element: HTMLElement | null = e.target! as unknown as HTMLElement;
		let count = 0;
		while (
			element &&
			element.getAttribute("data-item-id") == null &&
			count < 10 &&
			element.parentElement != null
		) {
			element = element.parentElement;
		}
		let itemId = element?.getAttribute("data-item-id") as
			| string
			| undefined;
		targetItemName = element?.getAttribute("data-item-name") as
			| string
			| undefined;
		targetItemId = itemId;
		if (targetItemId) {
			checkIfSwap();
		}
	}

	function handleDragStart(e: Event, item: TreeItem) {
		draggingItem = item as unknown as IBasicItemPopulated;
	}

	onDestroy(() => {
		dragDropUnsubscribe();
	});
</script>

<div class="tree-container">
	{#if loading}
		<p>Loading tree...</p>
	{:else}
		{#each treeData as item, index (item._id)}
			<div
				class="tree-branch"
				style="padding-left: {indentLevel * 0.75}rem;">
				<div
					class="flex"
					role="navigation"
					draggable="true"
					data-item-id={item._id}
					data-item-name={item.name}
					on:dragstart={(e) => {
						handleDragStart(e, item);
					}}
					on:dragover={(e) => {
						e.preventDefault();
						console.log(`Dragged over ${index}.`);
					}}
					on:dragend={(e) => {
						e.preventDefault();
						console.log("End Drag");
					}}
					on:drop={doDrop}>
					{#if item.hasChildren}
						<button
							class="expand-button"
							on:click={() => toggleExpand(item._id)}
							aria-label={expanded[item._id]
								? "Collapse"
								: "Expand"}>
							<span class="tree-icon">
								{expanded[item._id] ? "▾" : "▸"}
							</span>
						</button>
					{:else}
						<span class="expand-button placeholder-icon"></span>
					{/if}

					{#if useWindowView}
						<!-- Use ItemLink for in-window navigation -->
						<ItemLink
							className="flex-grow"
							itemId={ensureString(item._id)}
							itemName={item.name}
							on:openItem>
							<button
								class="tree-item-card important-text
									{item._id === currentId ? 'current' : ''}"
								aria-current={item._id === currentId}>
								<div class="flex">
									<div class="draggable-tree-dot-icon">
										<svg viewBox="0 0 200 300" role="img">
											<circle
												cx="50"
												cy="50"
												r="25"
												style="fill: #ffffff" />
											<circle
												cx="50"
												cy="140"
												r="25"
												style="fill: #ffffff" />
											<circle
												cx="50"
												cy="230"
												r="25"
												style="fill: #ffffff" />
											<circle
												cx="140"
												cy="50"
												r="25"
												style="fill: #ffffff" />
											<circle
												cx="140"
												cy="140"
												r="25"
												style="fill: #ffffff" />
											<circle
												cx="140"
												cy="230"
												r="25"
												style="fill: #ffffff" />
										</svg>
									</div>
									{item.name}
								</div>
							</button>
						</ItemLink>
					{/if}
				</div>

				{#if expanded[item._id] && item.children}
					<svelte:self
						bind:draggingItem
						bind:targetItemId
						bind:targetItemName
						bind:showMoveDialog
						rootData={item.children}
						indentLevel={indentLevel + 1}
						{currentId}
						{useWindowView}
						on:openItem />
				{/if}
			</div>
		{/each}
	{/if}
</div>
