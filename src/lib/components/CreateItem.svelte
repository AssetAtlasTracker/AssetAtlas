<script lang="ts">
	import { browser } from '$app/environment';
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import Device from 'svelte-device-info'
	import { createEventDispatcher } from "svelte";

	import "$lib/styles/main.css";
	import CreateItemDesktop from "./CreateItemDesktop.svelte";
	import CreateItemMobile from "./CreateItemMobile.svelte";

	export let dialog: HTMLDialogElement;
	export let item: IBasicItemPopulated | null;
	export let duplicate = false;

	const dispatch = createEventDispatcher();
	
	let creator: CreateItemDesktop | CreateItemMobile;

	export function changeItem(newItem: IBasicItemPopulated){
		creator.changeItem(newItem);
	}
</script>

{#if browser && Device.isMobile}
	<CreateItemMobile
		bind:dialog={dialog}
		bind:this={creator}
		item={item}
		duplicate={duplicate}
		on:itemCreated={() => dispatch("itemCreated")} 
	/>
{:else}
	<CreateItemDesktop
		bind:dialog={dialog}
		bind:this={creator}
		item={item}
		duplicate={duplicate}
		on:itemCreated={() => dispatch("itemCreated")} 
	/>
{/if}
