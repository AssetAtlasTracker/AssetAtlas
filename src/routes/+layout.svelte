<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ActionDisplay from '$lib/components/ActionDisplay.svelte';
	import '$lib/styles/main.css';
	import '../app.css';
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ActionDisplay />

{@render children?.()}
