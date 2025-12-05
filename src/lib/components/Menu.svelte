<script lang="ts">
	import OAuth from "$lib/components/OAuth.svelte";
	import "$lib/styles/main.css";
	import { onMount } from "svelte";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import {login} from "$lib/stores/loginStore.js";

	var open = false;
	export let menu;
	let authDialog: HTMLDialogElement;

	function handleClicked() {
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

		const response = await fetch('/api/oauth/profile');
		if (response.ok) {
			const userData = await response.json();
			login.set({
				isLoggedIn: true,
				name: userData.name,
				sub_id: userData.sub_id,
				permissionLevel: userData.permissionLevel
			});
		}
	});

	//if permission level is ever undefined (it shouldnt be but typescript seems to think it may be) we default to 0
	$: permissionLevel = currentLogin?.permissionLevel ?? 0;
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
				Login/Logout
			</button>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<a href="/utility">Import/Export</a>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<a href="/viewTemplates">Templates</a>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<a href={`/about`}>About</a>
		</nav>

		{#if permissionLevel >= 9}
			<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
				<a href="/users">User List</a>
			</nav>
		{/if}
	</div>
</div>

<OAuth bind:dialog={authDialog} />
