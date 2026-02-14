<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { dragDropMode } from "$lib/stores/dragDropStore.js";
	import { GripVerticalIcon } from "@lucide/svelte";
	import ItemLink from "./ItemLink.svelte";
	import ItemTree from "./ItemTree.svelte";

	interface TreeItem {
		_id: string;
		name: string;
		description?: string;
		children: TreeItem[];
		hasChildren: boolean;
	};

	let {
		searchQuery = "",
		exactSearch = false,
		draggingItem = $bindable(),
		targetItemId = $bindable(),
		targetItemName = $bindable(),
		showMoveDialog = $bindable(),
		useWindowView = false,
		parentId = null,
		indentLevel = 0,
		rootData = null,
		currentId = null,
	} = $props<{
		searchQuery?: string;
		exactSearch?: boolean;
		draggingItem?: IBasicItemPopulated | null;
		targetItemId?: string;
		targetItemName?: string;
		showMoveDialog?: boolean;
		useWindowView?: boolean;
		parentId?: string | null;
		indentLevel?: number;
		rootData?: TreeItem[] | null;
		currentId?: string | null;
	}>();

	export function closeMoveDialog() {
		showMoveDialog = false;
	}

	let treeData = $state<TreeItem[]>([]);
	let expanded = $state<Record<string, boolean>>({});
	let loading = $state(true);

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

	$effect(() => {
		void loadTree();
	});

	function checkIfSwap() {
		if (
			$dragDropMode &&
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
					ondragstart={(e) => {
						handleDragStart(e, item);
					}}
					ondragover={(e) => {
						e.preventDefault();
						console.log(`Dragged over ${index}.`);
					}}
					ondragend={(e) => {
						e.preventDefault();
						console.log("End Drag");
					}}
					ondrop={doDrop}>
					{#if item.hasChildren}
						<button
							class="expand-button"
							onclick={() => toggleExpand(item._id)}
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
							itemId={item._id ? item._id.toString() : ""}
							itemName={item.name}
							on:openItem>
							<button
								class="tree-item-card important-text
									{item._id === currentId ? 'current' : ''}"
								aria-current={item._id === currentId}>
								<div class="flex">
									<div class="grip-vertical-icon">
										<GripVerticalIcon class="icon-small" />
									</div>
									{item.name}
								</div>
							</button>
						</ItemLink>
					{/if}
				</div>

				{#if expanded[item._id] && item.children}
					<ItemTree
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
