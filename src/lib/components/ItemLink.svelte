<script lang="ts">
	import { createEventDispatcher } from "svelte";

	let { itemId, itemName = "", className = "" } = $props<{
		itemId: string;
		itemName?: string;
		className?: string;
	}>();
  
	const dispatch = createEventDispatcher();
  
	function handleClick(event: MouseEvent) {
		event.preventDefault();
		dispatch("openItem", { id: itemId, name: itemName });
	}
</script>

<button class={className} onclick={handleClick}>
	{itemName}
</button>
