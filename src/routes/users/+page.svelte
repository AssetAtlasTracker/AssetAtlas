<script lang="ts">
	import UserList from "$lib/components/UserList.svelte";
	import { onMount } from "svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import ActionDisplay from "$lib/components/ActionDisplay.svelte";
	import "$lib/styles/main.css";
	import type { PageData } from './$types';
	import { error } from "@sveltejs/kit";
    import { on } from "events";

	let menu: HTMLDialogElement;
	let searchQuery = "";
	export let data: PageData;
  
	function onSearch(query: string) {
	//maybe some day
	}
	

	console.log("Users.svelte is loading");
</script>

<ActionDisplay />

<TopBar searchQuery="" {onSearch} {menu}></TopBar>

<div class="page-with-topbar">
    <Menu bind:menu />
    {#if !data.isLoggedIn}
        <h1>Please log in to view users.</h1>
    {:else}
        <UserList />
    {/if}
</div>
