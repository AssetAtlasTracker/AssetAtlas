<script lang="ts">
	import { browser } from '$app/environment';
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import Device from 'svelte-device-info'
	import { createEventDispatcher, onMount } from "svelte";
	import { 
		changeItem as changeItemState,
		createItemState,
		loadAllTemplates,
		selectTemplate,
		setDuplicate
	} from "$lib/stores/createItemStore.svelte";

	import "$lib/styles/main.css";
	import CreateItemDesktop from "./CreateItemDesktop.svelte";
	import CreateItemMobile from "./CreateItemMobile.svelte";

	export let dialog: HTMLDialogElement;
	export let duplicate = false;

	const dispatch = createEventDispatcher();
	
	let creator: CreateItemDesktop | CreateItemMobile;
	let allTemplates: any[] = [];
	let filteredTemplates: any[] = [];

	onMount(async () => {
		const raw = await loadAllTemplates();
		allTemplates = raw
			.map((t) => ({ ...t, _id: t?._id ?? t?.id }))
			.filter((t) => t?._id);
		filteredTemplates = allTemplates;
	});

	export function changeItem(newItem: IBasicItemPopulated){
		changeItemState(newItem);
	}

	function onTemplateInputValueChange(details: { inputValue: string }) {
		createItemState.templateName = details.inputValue;
		const query = details.inputValue.trim().toLowerCase();
		filteredTemplates = query
			? allTemplates.filter((t) => t?.name?.toLowerCase().includes(query))
			: allTemplates;
	}

	function onTemplateSelect(details: { itemValue?: string }) {
		if (!details.itemValue) return;
		const selected = allTemplates.find(
			(t) => String(t._id) === details.itemValue,
		);
		if (selected) {
			selectTemplate(selected);
			filteredTemplates = allTemplates; 
		}
	}

	setDuplicate(duplicate);
</script>

{#if browser && Device.isMobile}
	<CreateItemMobile
		bind:dialog={dialog}
		bind:this={creator}
		duplicate={duplicate}
		filteredTemplates={filteredTemplates}
		onTemplateInputValueChange={onTemplateInputValueChange}
		onTemplateSelect={onTemplateSelect}
		on:itemCreated={() => dispatch("itemCreated")} 
	/>
{:else}
	<CreateItemDesktop
		bind:dialog={dialog}
		bind:this={creator}
		duplicate={duplicate}
		filteredTemplates={filteredTemplates}
		onTemplateInputValueChange={onTemplateInputValueChange}
		onTemplateSelect={onTemplateSelect}
		on:itemCreated={() => dispatch("itemCreated")} 
	/>
{/if}
