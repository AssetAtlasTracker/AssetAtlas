<script lang="ts">
	import "../svelteStyles/main.css";
	import { Link } from "svelte-routing";
	import { onMount } from "svelte";
	import UserAuth from "./UserAuth.svelte";
	import { user } from "../stores/userStore.js";
	import type { UserState } from "../stores/userStore.js";

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

<button
	class="glass h-full slide-out-menu"
	bind:this={menu}
	class:open
	on:click={handleClicked}
>
	<div class="block">
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/`}>Home</Link>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<button on:click={openAuthDialog} class="text-left">
				{#if currentUser?.isLoggedIn}
					User: {currentUser.username}
				{:else}
					User Login
				{/if}
			</button>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/utility`}>Import/Export</Link>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/viewTemplates`}>Templates</Link>
		</nav>

		{#if permissionLevel >= 9}
			<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
				<Link to={`/users`}>User List</Link>
			</nav>
		{/if}
	</div>
</button>

<UserAuth bind:dialog={authDialog} />
