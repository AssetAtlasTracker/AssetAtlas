<script lang="ts">
	import "../svelteStyles/main.css";
	import { Link } from "svelte-routing";
	import { onMount } from "svelte";
	var open = false;
	export let menu;

	function handleClicked() {
		open = !open;
	}

	onMount(() => {
		const topBar = document.querySelector(".top-bar");
		if (topBar) {
			const height = topBar.getBoundingClientRect().height;
			document.documentElement.style.setProperty(
				"--top-bar-height",
				`${height}px`,
			);
		}
	});
</script>

<button
	class="glass h-full slide-out-menu"
	bind:this={menu}
	class:open
	on:click={handleClicked}
>
	<div class="block">
		<nav class="pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/utility`}>Import/Export</Link>
		</nav>
		<nav class="pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/viewTemplates`}>Templates</Link>
		</nav>
	</div>
</button>
