<script lang="ts">
	import "../svelteStyles/main.css";
	import { Link } from 'svelte-routing';
	var open = false;
    export let menu;

	function handleClicked() {
		console.log("Clicked");
		open = !open;
	}
</script>

<button class="glass h-full absolute slide-out-menu" bind:this={menu} class:open on:click={handleClicked}>
	<nav class="p-12 text-xl">
		<Link to={`/utility`}>Utility</Link>
	</nav>
</button>