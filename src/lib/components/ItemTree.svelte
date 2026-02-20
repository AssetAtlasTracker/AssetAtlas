<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { dragDropMode } from "$lib/stores/dragDropStore.js";
	import { GripVerticalIcon } from "@lucide/svelte";
	import ItemLink from "./ItemLink.svelte";

	type TreeItem = {
		_id: string;
		name: string;
		description?: string;
		children: TreeItem[];
		hasChildren: boolean;
	};

	interface VisibleNode {
		item: TreeItem;
		level: number;
	}

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
		rootData?: Array<{
			_id: string;
			name: string;
			description?: string;
			children: unknown[];
			hasChildren: boolean;
		}> | null;
		currentId?: string | null;
	}>();

	export function closeMoveDialog() {
		showMoveDialog = false;
	}

	let treeData = $state<TreeItem[]>([]);
	let expanded = $state<Record<string, boolean>>({});
	let loading = $state(true);
	let visibleNodes = $derived.by((): VisibleNode[] => {
		const nodes: VisibleNode[] = [];
		const walk = (items: TreeItem[], level: number) => {
			items.forEach((treeItem) => {
				nodes.push({ item: treeItem, level });
				if (expanded[treeItem._id] && treeItem.children?.length) {
					walk(treeItem.children, level + 1);
				}
			});
		};
		walk(treeData, indentLevel);
		return nodes;
	});

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
			treeData = rootData as TreeItem[];
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
		{#each visibleNodes as node, index (node.item._id)}
			<div
				class="tree-branch"
				style="padding-left: {node.level * 0.75}rem;">
				<div
					class="flex"
					role="navigation"
					draggable="true"
					data-item-id={node.item._id}
					data-item-name={node.item.name}
					ondragstart={(e) => {
						handleDragStart(e, node.item);
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
					{#if node.item.hasChildren}
						<button
							class="expand-button"
							onclick={() => toggleExpand(node.item._id)}
							aria-label={expanded[node.item._id]
								? "Collapse"
								: "Expand"}>
							<span class="tree-icon">
								{expanded[node.item._id] ? "▾" : "▸"}
							</span>
						</button>
					{:else}
						<span class="expand-button placeholder-icon"></span>
					{/if}

					{#if useWindowView}
						<!-- Use ItemLink for in-window navigation -->
						<ItemLink
							className="flex-grow"
							itemId={node.item._id ? node.item._id.toString() : ""}
							itemName={node.item.name}
							on:openItem>
							<button
								class="tree-item-card important-text
									{node.item._id === currentId ? 'current' : ''}"
								aria-current={node.item._id === currentId}>
								<div class="flex">
									<div class="grip-vertical-icon">
										<GripVerticalIcon class="icon-small" />
									</div>
									{node.item.name}
								</div>
							</button>
						</ItemLink>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>
