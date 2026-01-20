<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import { getEditOnLogin, login } from "$lib/stores/loginStore.js";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import EditItem from "./EditItem.svelte";
	import ItemLink from "./ItemLink.svelte";

	interface ItemUpdateEvent extends CustomEvent {
		detail: {
			imageChanged: boolean;
			[key: string]: any;
		};
	}

	// Add optional itemId prop
	export let item: IBasicItemPopulated | null = null;
	export let itemId: string | null = null;

	export let moveDialog: HTMLDialogElement | undefined = undefined;
	export let returnDialog: HTMLDialogElement | undefined = undefined;
	export let editDialog: HTMLDialogElement | undefined = undefined;
	export let deleteDialog: HTMLDialogElement | undefined = undefined;
	export let showItemTree: boolean = true;

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

	onMount(async () => {
		if (itemId && !item) {
			await loadItemById(itemId);
		}
		if (item) {
			loadParentChain();
		}
	});

	$: if (item?._id) {
		loadParentChain();
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

	//Handle updates from EditItem
	function handleItemUpdated(event: ItemUpdateEvent) {
		if (event.detail.imageChanged) {
			setTimeout(reloadImage, 500);
		}
	}

	//Add event listener on mount and clean up on destroy
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

	//Forward the openItem event from ItemLink
	const dispatch = createEventDispatcher();

	function handleItemLinkClick(event: CustomEvent) {
		//Forward the event to parent
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
			<!--Move button-->
			<button
				title="Move"
				class="border-button center-button-icons flex-grow font-semibold shadow"
				on:click={() => moveDialog?.showModal()}>
				<svg
					class="icon-small"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 512 512"
					><path
						fill="#ffffff"
						d="M512 160c0 35.3-28.7 64-64 64l-168 0 0 64 46.1 0c21.4 0 32.1 25.9 17 41L273 399c-9.4 9.4-24.6 9.4-33.9 0L169 329c-15.1-15.1-4.4-41 17-41l46.1 0 0-64L64 224c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 64zM448 416l0-64-82.7 0 .4-.4c18.4-18.4 20.4-43.7 11-63.6l71.3 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l71.3 0c-9.4 19.9-7.4 45.2 11 63.6l.4 .4L64 352l0 64 146.7 0 5.7 5.7c21.9 21.9 57.3 21.9 79.2 0l5.7-5.7L448 416z" /></svg>
			</button>

			<!--Return to home button-->
			<button
				title="Return to Home"
				class="border-button center-button-icons flex-grow font-semibold shadow"
				on:click={() => returnDialog?.showModal()}>
				<svg
					class="icon-small"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 576 512"
					><path
						fill="#ffffff"
						d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" /></svg>
			</button>

			{#if !getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)}
				<!--Edit button-->
				<button
					title="Edit"
					class="border-button center-button-icons flex-grow font-semibold shadow"
					on:click={() => editDialog?.showModal()}>
					<svg
						class="icon-small"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 512 512"
						><path
							fill="#ffffff"
							d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" /></svg>
				</button>
			{/if}

			<!-- Add Show Item Tree button when tree is hidden -->
			{#if !showItemTree}
				<button
					title="Show Item Tree"
					class="border-button center-button-icons flex-grow font-semibold shadow"
					on:click={() => (showItemTree = true)}>
					<svg
						class="icon-small"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 576 512"
						><path
							fill="#ffffff"
							d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32l0 96L0 384c0 35.3 28.7 64 64 64l192 0 0-64L64 384l0-224 192 0 0-64L64 96l0-64zM288 192c0 17.7 14.3 32 32 32l224 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32l-98.7 0c-8.5 0-16.6-3.4-22.6-9.4L409.4 9.4c-6-6-14.1-9.4-22.6-9.4L320 0c-17.7 0-32 14.3-32 32l0 160zm0 288c0 17.7 14.3 32 32 32l224 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32l-98.7 0c-8.5 0-16.6-3.4-22.6-9.4l-13.3-13.3c-6-6-14.1-9.4-22.6-9.4L320 288c-17.7 0-32 14.3-32 32l0 160z" /></svg>
				</button>
			{/if}

			{#if (currentLogin?.permissionLevel ?? 1) > 2}
				<!--Delete button-->
				<button
					title="Delete"
					class="warn-button center-button-icons flex-grow font-semibold shadow"
					on:click={() => deleteDialog?.showModal()}>
					<svg
						class="icon-small"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 448 512"
						><path
							fill="#ffffff"
							d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
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
