<!-- Icons from: 
 Font Awesome Free 6.7.2 by @fontawesome 
 - https://fontawesome.com License 
 - https://fontawesome.com/license/free 
 Copyright 2025 Fonticons, Inc.-->

<script lang="ts">
	import CreateItem from "./CreateItem.svelte";
	import Duplicate from "./Duplicate.svelte";
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { createEventDispatcher } from "svelte";
	import {login, getEditOnLogin} from '../stores/loginStore.js';
	import type { LoginState } from "../stores/loginStore.js";

	export let item: IBasicItemPopulated;

	const dispatch = createEventDispatcher();
	let createDialog: HTMLDialogElement;
	let duplicateDialog: HTMLDialogElement;
	let creator: CreateItem;
	let duplicator: Duplicate;
	let selectedItem: IBasicItemPopulated | null = null;

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	let unique = {};

	function duplicateFunction(item: IBasicItemPopulated) {
		if(!getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)){
			duplicator.changeItem(item);
			duplicateDialog.showModal();
		}    
	}

	function duplicateEditFunction(item: IBasicItemPopulated) {
		if(!getEditOnLogin() || (currentLogin?.isLoggedIn && currentLogin?.permissionLevel > 1)){
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
			on:click={() => duplicateFunction(item)}
		>
			<span class="hovertiptext">Duplicate</span>
			<svg
				class="icon-small"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 512 512"
			>
				<path
					fill="#ffffff"
					d="M288 448L64 448l0-224 64 0 0-64-64 0c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-64-64 0 0 64zm-64-96l224 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L224 0c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64z"/>
			</svg>
		</button>
		<!--Duplicate and Edit button-->
		<button
			class="border-button hoverable"
			type="button"
			on:click={() => duplicateEditFunction(item)}
		>
			<span class="hovertiptext">Duplicate and edit</span>
			<img src="/icons/DupAndEdit.svg" alt="Duplicate and Edit" width="40" />
		</button>
	{/if}
</div>

{#key unique}
	<CreateItem
		bind:dialog={createDialog}
		bind:this={creator}
		item={selectedItem}
		duplicate={true}
		on:itemCreated={onCreated}
		on:close={() => createDialog?.close()}
	/>
{/key}

{#key unique}
	<Duplicate
		bind:dialog={duplicateDialog}
		bind:this={duplicator}
		{item}
		on:itemCreated={onCreated}
		on:close={() => duplicateDialog?.close()}
	/>
{/key}
