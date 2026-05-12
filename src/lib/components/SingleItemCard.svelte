<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { createEventDispatcher } from "svelte";
	import ItemCardOptions from "./ItemCardOptions.svelte";
	import "$lib/styles/main.css";

	let { item = $bindable() } = $props<{
		item: IBasicItemPopulated;
	}>();

	const dispatch = createEventDispatcher();

	function onCreated() {
		dispatch("itemCreated");
	}
</script>

<div class="single-item-card-flex glass" role="navigation">
	<a href={`/view/${item._id}`} class="single-item-card glass">
		<div class="single-item-card-subcard single-item-card-main-row">
			<div class="single-item-card-text-block">
				<div class="single-important-text">
					{item.name}
				</div>
				<div class="single-sub-text">
					{item.description || "No Description"}
				</div>
			</div>
			<div class="single-sub-text single-item-card-location">
				Location: {item.parentItem?.name || "None"}
			</div>
		</div>
	</a>
	<ItemCardOptions item={item} on:itemCreated={onCreated} />
</div>
