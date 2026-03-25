<script lang="ts">
	import type { Snippet } from "svelte";
	import { createEventDispatcher } from "svelte";

	let {
		itemId,
		itemName = "",
		className = "",
		children
	} = $props<{
		itemId: string;
		itemName?: string;
		className?: string;
		children?: Snippet;
	}>();
  
	const dispatch = createEventDispatcher();
  
	function handleClick(event: MouseEvent) {
		event.preventDefault();
		dispatch("openItem", { id: itemId, name: itemName });
	}
</script>

<button class={className} onclick={handleClick}>
	{@render children?.()}
	{#if !children}
		{itemName}
	{/if}
</button>
