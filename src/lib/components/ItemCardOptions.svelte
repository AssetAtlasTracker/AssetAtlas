<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { CopyIcon, SquarePenIcon } from "@lucide/svelte";
	import { createEventDispatcher } from "svelte";
	import type { LoginState } from "../stores/loginStore.js";
	import { getEditOnLogin, login } from "../stores/loginStore.js";
	import CreateItem from "./CreateItem.svelte";
	import Duplicate from "./Duplicate.svelte";

	export let item: IBasicItemPopulated;

	const dispatch = createEventDispatcher();
	let createDialog: HTMLDialogElement;
	let duplicateDialog: HTMLDialogElement;
	let creator: CreateItem;
	let duplicator: Duplicate;

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	let unique = {};

	function duplicateFunction(item: IBasicItemPopulated) {
		if (
			!getEditOnLogin() ||
			(currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)
		) {
			duplicator.changeItem(item);
			duplicateDialog.showModal();
		}
	}

	function duplicateEditFunction(item: IBasicItemPopulated) {
		if (
			!getEditOnLogin() ||
			(currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)
		) {
			creator.changeItem(item);
			createDialog.showModal();
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
	{#if !getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)}
		<!--Duplicate button-->
		<button
			class="border-button hoverable"
			type="button"
			on:click={() => duplicateFunction(item)}>
			<span class="hovertiptext">Duplicate</span>
			<CopyIcon class="icon-small" />
		</button>
		<!--Duplicate and Edit button-->
		<button
			class="border-button hoverable"
			type="button"
			on:click={() => duplicateEditFunction(item)}>
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
