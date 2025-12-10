<script lang="ts">
	import CreateTemplate from "$lib/components/CreateTemplate.svelte";
	import Dialog from "$lib/components/Dialog.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import TemplateList from "$lib/components/TemplateList.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import type { ITemplatePopulated } from "$lib/server/db/models/template.js";
	import type { LoginState } from "$lib/stores/loginStore.js";
	import { getEditOnLogin, login } from "$lib/stores/loginStore.js";
	import { onMount } from "svelte";

	import "$lib/styles/main.css";

	let templates: ITemplatePopulated[] = [];
	let menu: HTMLDialogElement;
	let templateDialog: HTMLDialogElement | undefined;

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	async function fetchTemplates() {
		try {
			const response = await fetch(`/api/templates`);

			if (!response.ok) {
				throw new Error(
					`Failed to fetch templates: ${response.status} ${response.statusText}`,
				);
			}

			const data: ITemplatePopulated[] = await response.json();
			templates = data;
		} catch (err) {
			console.error("Error fetching templates:", err);
			templates = [];
		}
	}

	let showCreateTemplateDialog = false;

	$: if (showCreateTemplateDialog && templateDialog) {
		templateDialog.showModal();
	}

	function closeCreateDialog() {
		showCreateTemplateDialog = false;
		templateDialog?.close();
	}

	function handleTemplateCreated() {
		closeCreateDialog();
		fetchTemplates();
	}

	fetchTemplates();

	function onSearch(query: string) {}

	onMount(() => {
		document.title = "Templates - AssetAtlas";
		fetchTemplates();
	});
</script>

<TopBar searchQuery="" {onSearch} {menu}></TopBar>

<div class="page-with-topbar">
	<Menu bind:menu />
	<TemplateList {templates} />

	{#if !getEditOnLogin() || currentLogin?.isLoggedIn}
		<button
			class="add-button text-icon font-bold shadow"
			on:click={() => {
				showCreateTemplateDialog = true;
			}}>
			+
		</button>
	{/if}

	{#if showCreateTemplateDialog}
		<Dialog
			bind:dialog={templateDialog}
			isLarge={false}
			create={() => {}}
			close={closeCreateDialog}>
			<CreateTemplate
				on:templateCreated={handleTemplateCreated}
				on:close={closeCreateDialog} />
		</Dialog>
	{/if}
</div>
