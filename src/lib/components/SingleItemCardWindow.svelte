<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { createEventDispatcher } from "svelte";
	import SingleItemCard from "./SingleItemCard.svelte";
	import Window from "./Window.svelte";

	let {
		item,
		initialX = 520,
		initialY = 64,
		windowTitle,
		windowClass = "page-component",
		showClose = true,
		showOpenInNewTab = true,
		showCollapse = true,
	} = $props<{
		item: IBasicItemPopulated;
		initialX?: number;
		initialY?: number;
		windowTitle?: string;
		windowClass?: string;
		showClose?: boolean;
		showOpenInNewTab?: boolean;
		showCollapse?: boolean;
	}>();

	const dispatch = createEventDispatcher();

	function handleItemCreated() {
		dispatch("itemCreated");
	}

	let resolvedWindowClass = $derived(
		`${windowClass} single-item-card-window`.trim(),
	);
</script>

<Window
	{initialX}
	{initialY}
	windowTitle={windowTitle ?? `Item: ${item.name}`}
	windowClass={resolvedWindowClass}
	{showClose}
	{showOpenInNewTab}
	{showCollapse}>
	<SingleItemCard {item} on:itemCreated={handleItemCreated} />
</Window>

<style>
	:global(.single-item-card-window.floating-container) {
		width: min(760px, calc(100vw - 2rem));
		max-width: min(860px, calc(100vw - 2rem));
		min-width: min(640px, calc(100vw - 2rem));
	}
</style>
