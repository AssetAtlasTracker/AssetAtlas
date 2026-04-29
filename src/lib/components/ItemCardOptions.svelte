<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { permissionsAllowEdit } from "$lib/stores/loginStore.js";
	import { CopyIcon, SquarePenIcon } from "@lucide/svelte";
	import { createEventDispatcher } from "svelte";
	import CreateItem from "./CreateItem.svelte";
	import Duplicate from "./Duplicate.svelte";

	let { item = $bindable() } = $props<{
		item: IBasicItemPopulated;
	}>();

	const dispatch = createEventDispatcher();
	let createDialog = $state<HTMLDialogElement | undefined>(undefined);
	let duplicateDialog = $state<HTMLDialogElement | undefined>(undefined);
	let creator = $state<CreateItem | undefined>(undefined);
	let duplicator = $state<Duplicate | undefined>(undefined);

	let unique = $state({});

	function duplicateFunction(item: IBasicItemPopulated) {
		if (permissionsAllowEdit(2)) {
			duplicator?.changeItem(item);
			duplicateDialog?.showModal();
		}
	}

	function duplicateEditFunction(item: IBasicItemPopulated) {
		if (permissionsAllowEdit(2)) {
			creator?.changeItem(item);
			createDialog?.showModal();
		}
	}

	function onCreated() {
		dispatch("itemCreated");
	}

	export function setItem(newItem: IBasicItemPopulated) {
		item = newItem;
	}
</script>

<div class="simple-flex">
	{#if permissionsAllowEdit(2)}
		<!--Duplicate button-->
		<button
			class="border-button hoverable"
			type="button"
			onclick={() => duplicateFunction(item)}>
			<span class="hovertiptext">Duplicate</span>
			<CopyIcon class="icon-small" />
		</button>
		<!--Duplicate and Edit button-->
		<button
			class="border-button hoverable"
			type="button"
			onclick={() => duplicateEditFunction(item)}>
			<span class="hovertiptext">Duplicate and edit</span>
			<SquarePenIcon class="icon-small" />
		</button>
	{/if}
</div>

{#key unique}
	<CreateItem
		bind:dialog={createDialog}
		bind:this={creator}
		originalItem={item}
		on:itemCreated={onCreated}
		on:close={() => createDialog?.close()} />
{/key}

{#key unique}
	<Duplicate
		bind:dialog={duplicateDialog}
		bind:this={duplicator}
		{item}
		on:itemCreated={onCreated}
		on:close={() => duplicateDialog?.close()} />
{/key}
