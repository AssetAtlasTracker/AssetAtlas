<script lang="ts">
  import type { ITemplatePopulated } from "../models/template";
  import DeleteTemplate from "./DeleteTemplate.svelte";
  import EditTemplate from "./EditTemplate.svelte";
  import Dialog from "./Dialog.svelte";

  export let templates: ITemplatePopulated[] = [];

  let editingTemplate: ITemplatePopulated | null = null;
  let editDialog: HTMLDialogElement | undefined;

  function handleDelete(templateId: string) {
    templates = templates.filter(template => template._id.toString() !== templateId);
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
    <div class="rounded template-card">
      <div class="template">
        <strong>{template.name}</strong>
      </div>

      <div class="fields">
        <strong class="indented">Fields:</strong>
        <ul>
          {#each template.fields as field}
            <li class="indented">{field.fieldName} ({field.dataType})</li>
          {/each}
        </ul>
      </div>

      <DeleteTemplate templateId={template._id.toString()} onDelete={handleDelete}>
        Delete
      </DeleteTemplate>
      <button class="border-button font-semibold shadow ml-2" on:click={() => handleEdit(template)}>
        Edit
      </button>
    </div>
    <br />
  {/each}
{:else}
  <p>No templates found.</p>
{/if}

<Dialog bind:dialog={editDialog} on:close={closeEdit}>
  {#if editingTemplate}
    <EditTemplate template={editingTemplate} onClose={closeEdit} />
  {/if}
</Dialog>

<style>
  .page-component {
    margin: 1rem;
    padding: 1rem;
    background-color: rgba(var(--color-primary-800) / 0.5);
    box-shadow: 0 8px 32px 0 rgba(var(--color-primary-900) 0.4);
    border-radius: 10px;
  }

  .template-card {
    box-sizing: border-box;
    width: 95%;
    margin: 0.5rem auto;
    padding: 10px;
    background-color: rgba(var(--color-primary-800) / 0.8);
    box-shadow: 0 8px 32px 0 rgba(var(--color-primary-900) 0.4);
    border-radius: 10px;
    border: 1px solid rgba(var(--color-primary-100) / 0.9);
  }

  .template {
    display: inline-block;
    width: 25%;
  }

  .fields {
    width: 70%;
  }

  .indented {
    padding-left: 2rem;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    padding: 2px 0;
  }
</style>