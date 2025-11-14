<script lang="ts">
	import "../svelteStyles/main.css";
	import { Link } from "svelte-routing";
	import { onMount } from "svelte";
	import OAuth from "./OAuth.svelte";
	import type { LoginState } from "../stores/loginStore.js";
	import {login} from "../stores/loginStore.js";

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

<button
	class="glass slide-out-menu"
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
				{#if currentLogin?.isLoggedIn}
					User: {currentLogin?.name}
				{:else}
					Logout
				{/if}
			</button>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/utility`}>Import/Export</Link>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/viewTemplates`}>Templates</Link>
		</nav>
		<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
			<Link to={`/about`}>About</Link>
		</nav>

		{#if permissionLevel >= 9}
			<nav class="menu-button pl-12 pr-12 pt-4 pb-4 text-xl">
				<Link to={`/users`}>User List</Link>
			</nav>
		{/if}
	</div>
</button>

<OAuth bind:dialog={authDialog} />
