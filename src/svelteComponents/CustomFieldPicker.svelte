<script lang="ts">
  import InfoToolTip from "./InfoToolTip.svelte";
  export let field;
  export let onFieldNameInput: (event: Event) => void;
  export let onFieldFocus: () => void;
  export let onFieldBlur: () => void;
  export let showDeleteButton = true;
  export let onDelete: () => void;
  export let mode: 'template' | 'item' = 'item'; // Add this new prop

  const dataTypes = ["string", "number", "boolean", "date"];

  $: if (!field.dataType) {
    field.dataType = "string";
  }

  let previousDataType = field.dataType;

  // Replace the existing dataType watcher with this one
  $: if (!field.fromTemplate && field.dataType !== previousDataType) {
    // Only clear value on actual data type changes, not during initialization
    if (field.value && previousDataType) {
      field.value = '';
    }
    previousDataType = field.dataType;
  }

  function validateNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value && isNaN(Number(input.value))) {
      input.value = '';
    }
  }
</script>

<div class="field-container mb-4 p-2 border rounded">
  <!-- Field Name Section -->
  <div class="name-section">
    <input
      type="text"
      class="dark-textarea field-name-input"
      placeholder="Field Name"
      bind:value={field.fieldName}
      on:input={onFieldNameInput}
      on:focus={onFieldFocus}
      on:blur={onFieldBlur}
      disabled={field.fromTemplate}
    />
    {#if field.suggestions?.length > 0}
      <ul class="suggestions">
        <slot name="suggestions" />
      </ul>
    {/if}
  </div>

  <!-- Data Type Section -->
  <div class="type-section">
    {#if field.fromTemplate || field.isExisting}
      <input
        type="text"
        class="dark-textarea type-input"
        bind:value={field.dataType}
        disabled
      />
    {:else}
      <select
        class="dark-textarea type-input"
        bind:value={field.dataType}
      >
        {#each dataTypes as dt}
          <option value={dt}>{dt}</option>
        {/each}
      </select>
    {/if}
  </div>

  <!-- Only show value section for item mode -->
  {#if mode === 'item'}
    <div class="value-section">
      {#if field.dataType === 'boolean'}
        <select
          class="dark-textarea py-2 px-4 w-full"
          bind:value={field.value}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      {:else if field.dataType === 'number'}
        <input
          type="number"
          class="dark-textarea py-2 px-4 w-full"
          bind:value={field.value}
          on:input={validateNumberInput}
        />
      {:else if field.dataType === 'date'}
        <input
          type="date"
          class="dark-textarea py-2 px-4 w-full"
          bind:value={field.value}
        />
      {:else}
        <input
          type="text"
          class="dark-textarea py-2 px-4 w-full"
          bind:value={field.value}
        />
      {/if}
    </div>
  {/if}

  <!-- Replace delete button with either tooltip or delete button -->
  <div class="control-section">
    {#if field.fromTemplate}
      <InfoToolTip message="This field is required by the template and cannot be removed. Can be left blank if desired." />
    {:else if showDeleteButton}
      <button type="button" class="x-button" on:click={onDelete}>
        X
      </button>
    {/if}
  </div>
</div>

<style>
  .field-container {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    width: 100%;
    max-width: 800px;
    border-color: #374151;
    min-height: 42px; /* Add fixed height to prevent size changes */
  }

  .name-section {
    width: 150px;
    position: relative;
    flex-shrink: 0;
  }

  .field-name-input {
    width: 100%;
  }

  .suggestions {
    width: 100%;
    position: absolute;
    z-index: 10;
  }

  .type-section {
    width: 100px;
    flex-shrink: 0;
  }

  .type-input {
    width: 100%;
  }

  .value-section {
    width: 200px; 
    flex-shrink: 0;
  }

  .control-section {
    width: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.dark-textarea) {
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background: rgb(30, 30, 30);
    color: rgb(229, 231, 235);
  }

  input[type="date"] {
    color-scheme: dark;
  }

  /* Replace existing select styles with these */
  select {
    background: rgb(30, 30, 30); /* Match other inputs */
  }

  select:focus {
    background: rgb(30, 30, 30); /* Keep the same color when focused */
  }

  /* Style the dropdown box itself */
  select option {
    background: rgba(var(--color-primary-900));
    color: rgb(var(--theme-font-color-base));
    padding: 0.5rem;
  }

  select option:hover {
    background: rgba(var(--color-primary-800));
  }
</style>