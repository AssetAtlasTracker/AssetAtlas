<script lang="ts">
	import "../svelteStyles/main.css";
	import { Link } from 'svelte-routing';
	var open = false;
    export let menu;

	function handleClicked() {
		open = !open;
	}
</script>

<button class="glass h-full absolute slide-out-menu" bind:this={menu} class:open on:click={handleClicked}>
	<div class="block">
		<nav class="pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/utility`}>Utility</Link>
		</nav>
		<nav class="pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/viewTemplates`}>View Templates</Link>
		</nav>
	</div>
</button>