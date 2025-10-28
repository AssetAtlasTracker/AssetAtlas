<script lang="ts">
	import '../app.css';
	import '$lib/styles/main.css'
	import favicon from '$lib/assets/favicon.svg';
	import ActionDisplay from '$lib/components/ActionDisplay.svelte';
	
	let { children } = $props();

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ActionDisplay />

{@render children?.()}
