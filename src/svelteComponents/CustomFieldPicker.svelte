<script lang="ts">
  import InfoToolTip from "./InfoToolTip.svelte";
  export let field;
  export let onFieldNameInput: (event: Event) => void;
  export let onFieldFocus: () => void;
  export let onFieldBlur: () => void;
  export let showDeleteButton = true;
  export let onDelete: () => void;
  export let mode: "template" | "item" = "item";
  
  const dataTypes = ["string", "number", "boolean", "date"];

  $: if (!field.dataType) {
    field.dataType = "string";
  }
  let previousDataType = field.dataType;
  $: if (!field.fromTemplate && field.dataType !== previousDataType) {
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

<style>
  /* do not move this */
  .field-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 0.1rem !important;
    align-items: center;
    padding: 0.25rem;
    border-radius: 6px;
  }
  .name-section,
  .type-section,
  .value-section {
    width: 100%;
    margin: 0 !important;
  }
  .input-box,
  .dropdown-box {
    border-radius: 10px !important;
    padding: 0.5rem 1rem !important;
    height: 2.5rem !important;
    box-sizing: border-box !important;
    margin: 0 !important;
  }
</style>

<div class="field-container">
  <!-- Field Name Section -->
  <div class="name-section" style="position: relative;">
    <input
      type="text"
      placeholder="Field Name"
      bind:value={field.fieldName}
      on:input={onFieldNameInput}
      on:focus={onFieldFocus}
      on:blur={onFieldBlur}
      disabled={field.fromTemplate}
      class="input-box"
    />
    {#if field.suggestions?.length > 0}
      <ul class="suggestions">
        <slot name="suggestions" />
      </ul>
    {/if}
  </div>

  <!-- Data Type Section -->
  <div class="type-section">
    <div class="custom-dropdown">
      <select 
        disabled={field.fromTemplate || field.isExisting} 
        bind:value={field.dataType}
      >
        {#each dataTypes as dt}
          <option value={dt}>{dt}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Value Section (only in item mode) -->
  {#if mode === "item"}
    <div class="value-section">
      {#if field.dataType === "boolean"}
        <div class="custom-dropdown">
          <select bind:value={field.value} class="dropdown-box">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      {:else if field.dataType === "number"}
        <input type="number" bind:value={field.value} on:input={validateNumberInput} class="input-box" />
      {:else if field.dataType === "date"}
        <input type="date" bind:value={field.value} class="input-box" />
      {:else}
        <input type="text" bind:value={field.value} class="input-box" />
      {/if}
    </div>
  {/if}

  <!-- Control Section -->
  <div class="control-section">
    {#if field.fromTemplate}
      <InfoToolTip message="This field is required by the template and cannot be removed. Can be left blank if desired." />
    {:else if showDeleteButton}
      <button type="button" class="x-button" on:click={onDelete}> X </button>
    {/if}
  </div>
</div>
