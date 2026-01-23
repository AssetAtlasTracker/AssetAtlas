<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import { getEditOnLogin, login } from "$lib/stores/loginStore.js";
	import {
		FolderTreeIcon,
		HouseIcon,
		MoveIcon,
		PencilIcon,
		TrashIcon,
	} from "@lucide/svelte";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import EditItem from "./EditItem.svelte";
	import ItemLink from "./ItemLink.svelte";

	interface ItemUpdateEvent extends CustomEvent {
		detail: {
			imageChanged: boolean;
			[key: string]: any;
		};
	}

	export let item: IBasicItemPopulated | null = null;
	export let itemId: string | null = null;

	export let showItemTree: boolean = true;

	interface ActionDetail {
		item: IBasicItemPopulated | null;
		itemId: string | null;
		homeItemId: string | null;
		parentItemId: string | null;
		itemName: string;
	}

	export let onMove: ((detail: ActionDetail) => void) | undefined;
	export let onReturn: ((detail: ActionDetail) => void) | undefined;
	export let onEdit: ((detail: ActionDetail) => void) | undefined;
	export let onDelete: ((detail: ActionDetail) => void) | undefined;

	let parentChain: { _id: string; name: string }[] = [];
	let loading = !!itemId && !item;

	let imageElement: HTMLImageElement;
	//each image gets a random ID. trust the process
	const instanceId = Math.random().toString(36).substring(2, 15);

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	// Load item by ID if needed
	async function loadItemById(id: string) {
		loading = true;
		try {
			const response = await fetch(`/api/items/${id}`);
			if (response.ok) {
				item = await response.json();
			} else {
				console.error("Failed to fetch item:", await response.text());
			}
		} catch (error) {
			console.error("Error fetching item:", error);
		} finally {
			loading = false;
		}
	}

	async function loadParentChain() {
		// Only proceed if we have an item
		if (!item) return;

		parentChain = [];
		try {
			const response = await fetch(`/api/items/parentChain/${item._id}`);
			if (response.ok) {
				parentChain = await response.json();
			} else {
				console.error(
					"Failed to fetch parent chain:",
					await response.text(),
				);
			}
		} catch (error) {
			console.error("Error fetching parent chain:", error);
		}
	}

	async function updateTitle() {
		if (item) {
			dispatch("updateTitle", { name: item.name });
		}
	}

	onMount(async () => {
		if (itemId && !item) {
			await loadItemById(itemId);
		}
		if (item) {
			loadParentChain();
			updateTitle();
		}
	});

	$: if (item?._id) {
		loadParentChain();
		updateTitle();
	}

	$: if (itemId && !item) {
		loadItemById(itemId);
	}

	let isImageExpanded = false;

	function toggleImage() {
		isImageExpanded = !isImageExpanded;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			toggleImage();
		}
	}

	async function reloadImage() {
		if (item?.image) {
			try {
				const response = await fetch(`/api/items/${item._id}/image`);
				if (response.ok) {
					if (imageElement) {
						imageElement.src = `/api/items/${item._id}/image?t=${Date.now()}`;
					}
				}
			} catch (error) {
				console.error("Error reloading image:", error);
			}
		}
	}

	function handleItemUpdated(event: ItemUpdateEvent) {
		if (event.detail.imageChanged) {
			setTimeout(reloadImage, 500);
		}
	}

	onMount(() => {
		window.addEventListener(
			"itemUpdated",
			handleItemUpdated as EventListener,
		);
	});

	onDestroy(() => {
		window.removeEventListener(
			"itemUpdated",
			handleItemUpdated as EventListener,
		);
	});

	$: if (item?._id) {
		reloadImage();
	}

	let showEditDialog = false;

	let isHistoryExpanded = false;

	function toggleHistory() {
		isHistoryExpanded = !isHistoryExpanded;
	}

	function ensureString(id: any): string {
		if (!id) return "";
		return typeof id === "string" ? id : id.toString();
	}

	const buildDetail = (): ActionDetail => ({
		item,
		itemId,
		homeItemId: item?.homeItem ? ensureString(item.homeItem._id) : null,
		parentItemId: item?.parentItem
			? ensureString(item.parentItem._id)
			: null,
		itemName: item?.name ?? "",
	});

	const requestMove = () => onMove?.(buildDetail());
	const requestReturn = () => onReturn?.(buildDetail());
	const requestEdit = () => onEdit?.(buildDetail());
	const requestDelete = () => onDelete?.(buildDetail());

	const dispatch = createEventDispatcher();
	function handleItemLinkClick(event: CustomEvent) {
		dispatch("openItem", event.detail);
	}
</script>

{#if loading}
	<p>Loading item details...</p>
{:else if item}
	<div class="item-chain">
		{#if parentChain.length > 0}
			<span>Item Chain: </span>
			{#each parentChain as parent, index}
				{#if index < parentChain.length - 1}
					<span class="clickable-text">
						<ItemLink
							className=""
							itemId={ensureString(parent._id)}
							itemName={parent.name}
							on:openItem={handleItemLinkClick} />
					</span>
					<span class="separator"> &gt; </span>
				{:else}
					<!-- Render the last item as bold and non-clickable -->
					<span class="current-item">{parent.name}</span>
				{/if}
			{/each}
		{:else}
			<p>Loading item chain...</p>
		{/if}
	</div>

	<h1 id="underline-header" class="font-bold text-2xl">
		{item.name}
	</h1>

	<div class="button-row-flex">
		{#if !getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 0)}
			<button
				title="Move"
				class="border-button center-button-icons flex-grow font-semibold shadow"
				on:click={requestMove}>
				<MoveIcon class="icon-small" />
			</button>

			<button
				title="Return to Home"
				class="border-button center-button-icons flex-grow font-semibold shadow"
				on:click={requestReturn}>
				<HouseIcon class="icon-small" />
			</button>

			{#if !getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)}
				<button
					title="Edit"
					class="border-button center-button-icons flex-grow font-semibold shadow"
					on:click={requestEdit}>
					<PencilIcon class="icon-small" />
				</button>
			{/if}

			{#if !showItemTree}
				<button
					title="Show Item Tree"
					class="border-button center-button-icons flex-grow font-semibold shadow"
					on:click={() => (showItemTree = true)}>
					<FolderTreeIcon class="icon-small" />
				</button>
			{/if}

			{#if (currentLogin?.permissionLevel ?? 1) > 2}
				<button
					title="Delete"
					class="warn-button center-button-icons flex-grow font-semibold shadow"
					on:click={requestDelete}>
					<TrashIcon class="icon-small" />
				</button>
			{/if}
		{/if}
	</div>

	{#if item.image}
		<button
			type="button"
			class="item-image-container"
			class:expanded={isImageExpanded}
			on:click={toggleImage}
			on:keydown={handleKeydown}
			aria-label="Toggle image size">
			<img
				bind:this={imageElement}
				src={`/api/items/${item._id}/image?instance=${instanceId}`}
				alt={item.name}
				class="item-image"
				id={`item-image-${instanceId}`} />
		</button>
	{/if}

	{#if item.template}
		<p><strong>Template Name:</strong> {item.template.name}</p>
	{/if}
	<ul>
		{#if item.description}
			<li><strong>Description:</strong> {item.description}</li>
		{/if}

		{#if item.tags && item.tags.length > 0}
			<li><strong>Tags:</strong> {item.tags.join(", ")}</li>
		{/if}

		{#if item.parentItem}
			<li>
				<strong>Current Location:</strong>
				<span class="clickable-text">
					<ItemLink
						className=""
						itemId={ensureString(item.parentItem._id)}
						itemName={item.parentItem.name}
						on:openItem={handleItemLinkClick} />
				</span>
			</li>
		{:else}
			<li><strong>Current Location:</strong> No parent</li>
		{/if}

		{#if item.homeItem}
			<li>
				<strong>Home Location:</strong>
				<span class="clickable-text">
					<ItemLink
						className=""
						itemId={ensureString(item.homeItem._id)}
						itemName={item.homeItem.name}
						on:openItem={handleItemLinkClick} />
				</span>
			</li>
		{:else}
			<li><strong>Home Location:</strong> No home</li>
		{/if}

		{#if item.containedItems && item.containedItems.length > 0}
			<li>
				<strong>Contained Items:</strong>
				<ul>
					{#each item.containedItems as containedItem}
						<li>
							<span class="clickable-text">
								<ItemLink
									className=""
									itemId={ensureString(containedItem._id)}
									itemName={containedItem.name}
									on:openItem={handleItemLinkClick} />
							</span>
						</li>
					{/each}
				</ul>
			</li>
		{/if}

		{#if item.customFields && item.customFields.length > 0}
			<li>
				<strong>Custom Fields:</strong>
				<ul>
					{#each item.customFields as customField}
						<li>
							{customField.field.fieldName}: {customField.value}
						</li>
					{/each}
				</ul>
			</li>
		{/if}

		{#if item.itemHistory && item.itemHistory.length > 0}
			<li>
				<!-- TODO: Get rid of style= -->
				<div
					class="tree-container"
					style="display: flex; align-items: center; gap: 4px;">
					<strong>History Entries:</strong>
					<button class="expand-button" on:click={toggleHistory}>
						{isHistoryExpanded ? "▼" : "▶"}
					</button>
				</div>
				{#if isHistoryExpanded}
					<ul>
						{#each item.itemHistory as history}
							<li>
								{#if history.location}
									<strong> Location:</strong>
									<span class="clickable-text">
										<ItemLink
											className=""
											itemId={ensureString(
												history.location._id,
											)}
											itemName={history.location.name}
											on:openItem={handleItemLinkClick} />
									</span>
								{:else}
									<strong> Location:</strong> None
								{/if}
								<strong>Timestamp:</strong>
								{new Date(history.timestamp).toLocaleString()}
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/if}

		<li>
			<strong>Created At:</strong>
			{new Date(item.createdAt).toLocaleString()}
		</li>
		<li>
			<strong>Updated At:</strong>
			{new Date(item.updatedAt).toLocaleString()}
		</li>
	</ul>
{:else}
	<p>Loading item data...</p>
{/if}

{#if showEditDialog && item}
	<EditItem
		{item}
		on:close={() => {
			showEditDialog = false;
			location.reload();
		}} />
{/if}
