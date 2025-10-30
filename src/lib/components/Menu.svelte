<script lang="ts">
	import UserAuth from "./UserAuth.svelte";
	import { user } from "$lib/stores/userStore.js";
	import type { UserState } from "$lib/stores/userStore.js";
	import "$lib/styles/main.css";
	import { onMount } from "svelte";

	var open = false;
	export let menu;
	let authDialog: HTMLDialogElement;

	function handleClicked() {
		open = !open;
	}

	function openAuthDialog() {
		authDialog.showModal();
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

	let currentUser: UserState | undefined;
	user.subscribe((value) => {
		currentUser = value;
	});

	//if permission level is ever undefined (it shouldnt be but typescript seems to think it may be) we default to 0
	$: permissionLevel = currentUser?.permissionLevel ?? 0;
</script>

<div
	class="glass slide-out-menu"
	bind:this={menu}
	class:open
	on:click={handleClicked}
>
	<div class="block">
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<a href="/">Home</a>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<button on:click={openAuthDialog} class="text-left">
				{#if currentUser?.isLoggedIn}
					User: {currentUser.username}
				{:else}
					User Login
				{/if}
			</button>
			<!-- <h1>PLACEHOLDER: FIX ME!!!!</h1> -->
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<a href="/utility">Import/Export</a>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<a href="/viewTemplates">Templates</a>
		</nav>

		{#if permissionLevel >= 9}
			<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
				<a href="/users">User List</a>
			</nav>
		{/if}
	</div>
</div>

<UserAuth bind:dialog={authDialog} />
