<script lang="ts">
	import ActionDisplay from "$lib/components/ActionDisplay.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import UserList from "$lib/components/UserList.svelte";
	import "$lib/styles/main.css";
	import { login } from "../../lib/stores/loginStore.js";

	let menu = $state<HTMLDialogElement>();
  
	function onSearch(_query: string) {
	//TODO: Implement search functionality
	}

	console.log("Users.svelte is loading");
</script>

<ActionDisplay />

<TopBar searchQuery="" {onSearch} {menu}></TopBar>

<div class="page-with-topbar">
	<Menu bind:menu />
	{#if !$login.isLoggedIn}
		<h1>Please log in to view users.</h1>
	{:else}
		<UserList />
	{/if}
</div>
