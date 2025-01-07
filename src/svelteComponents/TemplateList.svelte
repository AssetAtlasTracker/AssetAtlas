<script lang="ts">
    import type { ITemplatePopulated } from "../models/template";
    import DeleteTemplate from "./DeleteTemplate.svelte";
  
    export let templates: ITemplatePopulated[] = [];
  
    function handleDelete(templateId: string) {
    templates = templates.filter(template => template._id.toString() !== templateId);
  }
  </script>
  
  {#if templates && templates.length > 0}
  <div class="rounded page-component">
    {#each templates as template}
      <div class="rounded template-card">
        <div class="template">
          <strong>{template.name}</strong>
        </div>

        <div class="fields">
          <strong>Fields:</strong>
          <ul>
            {#each template.fields as field}
              <li>{field.fieldName} ({field.dataType})</li>
            {/each}
          </ul>
        </div>

        <DeleteTemplate templateId={template._id.toString()} onDelete={handleDelete}>
            Delete
        </DeleteTemplate>
      </div>
      <br />
    {/each}
  </div>
{:else}
  <p>No templates found.</p>
{/if}

<style>
  .page-component {
    margin: 1.5rem;
    padding: 1.5rem;
    background-color: rgba(var(--color-primary-800) / 0.5);
    box-shadow: 0 8px 32px 0 rgba(var(--color-primary-900) 0.4);
    border-radius: 10px;
  }

  .template-card {
    box-sizing: border-box;
    width: 95%;
    margin: 0 auto;
    padding: 20px;
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

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    padding: 8px 0;
  }
</style>