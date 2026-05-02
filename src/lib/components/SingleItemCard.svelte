<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { createEventDispatcher } from "svelte";
	import ItemCardOptions from "./ItemCardOptions.svelte";

	let { item = $bindable() } = $props<{
		item: IBasicItemPopulated;
	}>();

	const dispatch = createEventDispatcher();

	function onCreated() {
		dispatch("itemCreated");
	}
</script>

<div class="item-card-flex glass" role="navigation">
	<a href={`/view/${item._id}`} class="item-card glass">
		<div class="item-subcard item-main-row">
			<div class="item-text-block">
				<div class="important-text">
					{item.name}
				</div>
				<div class="sub-text">
					{item.description || "No Description"}
				</div>
			</div>
			<div class="sub-text item-location">
				Location: {item.parentItem?.name || "None"}
			</div>
		</div>
	</a>
	<ItemCardOptions item={item} on:itemCreated={onCreated} />
</div>

<style>
	.item-card-flex {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.item-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.5rem;
		background: var(--glass-color, rgba(255, 255, 255, 0.1));
		text-decoration: none;
		color: inherit;
		transition: background-color 0.2s ease;
		flex: 1;
	}

	.item-card:hover {
		background: var(--glass-hover-color, rgba(255, 255, 255, 0.15));
	}

	.item-subcard {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.item-main-row {
		justify-content: space-between;
		gap: 1.5rem;
	}

	.item-text-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: left;
		min-width: 0;
	}

	.item-location {
		margin-left: auto;
		text-align: right;
		white-space: nowrap;
	}

	.important-text {
		font-weight: 600;
		font-size: 1.1rem;
	}

	.sub-text {
		font-size: 0.9rem;
		opacity: 0.7;
	}
</style>
