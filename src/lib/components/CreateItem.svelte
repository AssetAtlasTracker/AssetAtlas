<script lang="ts">
	import { browser } from '$app/environment';
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import Device from 'svelte-device-info'
	import { createEventDispatcher } from "svelte";
	import { 
        changeItem as changeItemState,
        setDuplicate
	} from "$lib/stores/createItemStore.svelte";

	import "$lib/styles/main.css";
	import CreateItemDesktop from "./CreateItemDesktop.svelte";
	import CreateItemMobile from "./CreateItemMobile.svelte";

	export let dialog: HTMLDialogElement;
	export let duplicate = false;

	const dispatch = createEventDispatcher();
	
	let creator: CreateItemDesktop | CreateItemMobile;

	export function changeItem(newItem: IBasicItemPopulated){
		changeItemState(newItem);
	}

	setDuplicate(duplicate);
</script>

<!-- {#if browser && Device.isMobile}
	<CreateItemMobile
		bind:dialog={dialog}
		bind:this={creator}
		duplicate={duplicate}
		on:itemCreated={() => dispatch("itemCreated")} 
	/>
{:else} -->
	<CreateItemDesktop
		bind:dialog={dialog}
		bind:this={creator}
		duplicate={duplicate}
		on:itemCreated={() => dispatch("itemCreated")} 
	/>
<!-- {/if} -->
