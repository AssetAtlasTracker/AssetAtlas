<script lang="ts">
	import type { ITemplatePopulated } from "$lib/server/db/models/template.js";
	import type { LoginState } from "../stores/loginStore.js";
	import { getEditOnLogin, login } from "../stores/loginStore.js";
	import DeleteTemplate from "./DeleteTemplate.svelte";
	import Dialog from "./Dialog.svelte";
	import EditTemplate from "./EditTemplate.svelte";

	export let templates: ITemplatePopulated[] = [];

	let editingTemplate: ITemplatePopulated | null = null;
	let editDialog: HTMLDialogElement | undefined;

	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

	function handleDelete(templateId: string) {
		templates = templates.filter(
			(template) => template._id.toString() !== templateId,
		);
	}

	function handleEdit(template: ITemplatePopulated) {
		editingTemplate = template;
		if (editDialog) {
			editDialog.showModal();
		}
	}

	function closeEdit() {
		editingTemplate = null;
		if (editDialog) {
			editDialog.close();
		}
	}
</script>

{#if templates && templates.length > 0}
	{#each templates as template}
		<div class="template-card">
			<div class="template">
				<strong>{template.name}</strong>
			</div>

			<div class="fields">
				<strong class="indented">Fields:</strong>
				<ul>
					{#each template.fields as field}
						<li class="indented">
							{field.fieldName} ({field.dataType})
						</li>
					{/each}
				</ul>
			</div>

			{#if !getEditOnLogin() || currentLogin?.isLoggedIn}
				<DeleteTemplate
					templateId={template._id.toString()}
					onDelete={handleDelete}>
					Delete
				</DeleteTemplate>
				<button
					class="border-button font-semibold shadow ml-2"
					on:click={() => handleEdit(template)}>
					Edit
				</button>
			{/if}
		</div>
		<br />
	{/each}
{:else if templates.length == 0}
	<div id="home-component" class="page-component glass">
		<p class="text-center important-text">No Templates Found</p>
		<br />
		<p class="text-center">
			Add new templates using the + button in the bottom right.
		</p>
		<p class="text-center">
			Or import bulk templates using the menu in the top left.
		</p>
		<br />
		<p class="text-center">
			If you are expecting templates to be here, you may need to refresh
			the page.
		</p>
	</div>
{/if}

<Dialog
	bind:dialog={editDialog}
	isLarge={false}
	create={() => {}}
	close={closeEdit}>
	{#if editingTemplate}
		<EditTemplate template={editingTemplate} onClose={closeEdit} />
	{/if}
</Dialog>
