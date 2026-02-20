<script lang="ts">
	import OAuth from "$lib/components/OAuth.svelte";
	import { login } from "$lib/stores/loginStore.js";
	import "$lib/styles/main.css";

	let {
		open = $bindable(false),
		menu
	} = $props<{
		open?: boolean;
		menu: HTMLDivElement;
	}>();
	let authDialog = $state<HTMLDialogElement>();

	export function handleClicked() {
		open = !open;
	}

	function openAuthDialog() {
		authDialog?.showModal();
	}

	$effect(() => {
		const topBar = document.querySelector(".top-bar");
		if (topBar) {
			const height = topBar.getBoundingClientRect().height;
			document.documentElement.style.setProperty(
				"--top-bar-height",
				`${height}px`,
			);
		}
	});

	const permissionLevel = $derived($login?.permissionLevel ?? 0);
</script>

{#if open}
	<div 
		class="menu-backdrop"
		role="button"
		tabindex="0"
		onclick={handleClicked}
		onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClicked()}
	></div>
{/if}

<div
	class="glass slide-out-menu"
	bind:this={menu}
	class:open
	role="button"
	tabindex="0"
	onclick={handleClicked}
	onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClicked()}
>
	<div class="block">
		<nav class="menu-button text-xl">
			<a href="/" class="block w-full pl-12 pr-12 pt-4 pb-4">Home</a>
		</nav>
		<nav class="menu-button text-xl">
			<button onclick={openAuthDialog} class="block w-full pl-12 pr-12 pt-4 pb-4 text-left">
				Login/Logout
			</button>
		</nav>
		<nav class="menu-button text-xl">
			<a href="/utility" class="block w-full pl-12 pr-12 pt-4 pb-4">Import/Export</a>
		</nav>
		<nav class="menu-button text-xl">
			<a href="/viewTemplates" class="block w-full pl-12 pr-12 pt-4 pb-4">Templates</a>
		</nav>
		<nav class="menu-button text-xl">
			<a href={`/about`} class="block w-full pl-12 pr-12 pt-4 pb-4">About</a>
		</nav>

		{#if permissionLevel >= 9}
			<nav class="menu-button text-xl">
				<a href="/users" class="block w-full pl-12 pr-12 pt-4 pb-4">User List</a>
			</nav>
		{/if}
	</div>
</div>

<style>
    .menu-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 40;
    }
</style>

<OAuth bind:dialog={authDialog} />
