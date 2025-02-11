<script lang="ts">
  import InfoToolTip from "./InfoToolTip.svelte";
  export let field;
  export let onFieldNameInput: (event: Event) => void;
  export let onFieldFocus: () => void;
  export let onFieldBlur: () => void;
  export let showDeleteButton = true;
  export let onDelete: () => void;
  export let mode: "template" | "item" = "item"; // Add this new prop

  const dataTypes = ["string", "number", "boolean", "date"];

  $: if (!field.dataType) {
    field.dataType = "string";
  }

  let previousDataType = field.dataType;

  // Replace the existing dataType watcher with this one
  $: if (!field.fromTemplate && field.dataType !== previousDataType) {
    // Only clear value on actual data type changes, not during initialization
    if (field.value && previousDataType) {
      field.value = "";
    }
    previousDataType = field.dataType;
  }

  function validateNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value && isNaN(Number(input.value))) {
      input.value = "";
    }
  }
</script>

<div class="field-container mb-4 p-2">
  <!-- Field Name Section -->
  <div class="name-section">
    <input
      type="text"
      class="dark-textarea p-2"
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
        class="dark-textarea p-2 type-input"
        bind:value={field.dataType}
        disabled
      />
    {:else}
      <select
        class="dark-textarea p-2 capitalize type-input"
        bind:value={field.dataType}
      >
        {#each dataTypes as dt}
          <!--TODO: Change string to text, and boolean to true/false-->
          <option class="capitalize" value={dt}>{dt}</option>
        {/each}
      </select>
    {/if}
  </div>

  <!-- Only show value section for item mode -->
  {#if mode === "item"}
    <div class="value-section">
      {#if field.dataType === "boolean"}
        <select class="dark-textarea p-2 w-full" bind:value={field.value}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      {:else if field.dataType === "number"}
        <input
          type="number"
          class="dark-textarea p-2 w-full"
          bind:value={field.value}
          on:input={validateNumberInput}
        />
      {:else if field.dataType === "date"}
        <input
          type="date"
          class="dark-textarea p-2 w-full"
          bind:value={field.value}
        />
      {:else}
        <input
          type="text"
          class="dark-textarea p-2 w-full"
          bind:value={field.value}
        />
      {/if}
    </div>
  {/if}

  <!-- Replace delete button with either tooltip or delete button -->
  <div class="control-section">
    {#if field.fromTemplate}
      <InfoToolTip
        message="This field is required by the template and cannot be removed. Can be left blank if desired."
      />
    {:else if showDeleteButton}
      <button type="button" class="x-button" on:click={onDelete}> X </button>
    {/if}
  </div>
</div>
