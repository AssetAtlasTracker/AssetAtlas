<script>
    let open = false;
    export let menu;
</script>

<aside class="glass absolute h-full" bind:this={menu} class:open on:close>
	<nav class="p-12 text-xl">
		<a class="block" href="#about">About</a>
		<a class="block" href="#contact">Contact</a>
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

<!-- <dialog class="glass page-component" 
        style="align-self: left; justify-self: left;" bind:this={menu} on:close>
    <button style="margin: 1rem 0rem 0rem 1rem; align-self: right;" 
            class="border-button hover:bg-gray-100 
            font-semibold shadow" on:click={() => menu.close()}>
        Cancel
    </button>
    <slot/>
</dialog> -->