<script lang="ts">
	import { Link } from 'svelte-routing';
	var open = false;
    export let menu;

	function handleClicked() {
		console.log("Clicked");
		open = !open;
	}
</script>

<aside class="glass absolute h-full" bind:this={menu} class:open on:click={handleClicked}>
	<nav class="p-12 text-xl">
		<Link to={`/utility`}>Utility</Link>
	</nav>
</aside>

<style>
	aside {
		left: -100%;
		transition: left 0.3s ease-in-out
	}
	
	.open {
		left: 0
	}
</style>

<!-- <div  class="sidenav">
	<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
	<a href="#">About</a>
	<a href="#">Services</a>
	<a href="#">Clients</a>
	<a href="#">Contact</a>
</div> -->