<script lang="ts">
	import OAuth from "$lib/components/OAuth.svelte";
	import "$lib/styles/main.css";
	import { onMount } from "svelte";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import {login} from "$lib/stores/loginStore.js";

	export let open = false;
	export let menu;
	let authDialog: HTMLDialogElement;

	export function handleClicked() {
		open = !open;
	}

	function openAuthDialog() {
		authDialog.showModal();
	}

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	onMount(async () => {
		const topBar = document.querySelector(".top-bar");
		if (topBar) {
			const height = topBar.getBoundingClientRect().height;
			document.documentElement.style.setProperty(
				"--top-bar-height",
				`${height}px`,
			);
		}
	});

	//if permission level is ever undefined (it shouldnt be but typescript seems to think it may be) we default to 0
	$: permissionLevel = currentLogin?.permissionLevel ?? 0;
</script>

{#if open}
    <div 
        class="menu-backdrop"
        on:click={handleClicked}
    ></div>
{/if}

<div
	class="glass slide-out-menu"
	bind:this={menu}
	class:open
	on:click={handleClicked}
>
	<div class="block">
		<nav class="menu-button text-xl">
			<a href="/" class="block w-full pl-12 pr-12 pt-4 pb-4">Home</a>
		</nav>
		<nav class="menu-button text-xl">
			<button on:click={openAuthDialog} class="block w-full pl-12 pr-12 pt-4 pb-4 text-left">
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
