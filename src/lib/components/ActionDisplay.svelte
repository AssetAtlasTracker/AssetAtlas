<script lang="ts">
	import { actionStore } from '$lib/stores/actionStore.js';
	import { fade } from 'svelte/transition';
</script>

<div class="action-container">
	{#each $actionStore as message (message.id)}
		<div class="action-message" transition:fade>
			{message.text}
		</div>
	{/each}
</div>

