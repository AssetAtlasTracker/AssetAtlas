<script lang="ts">
  import Dialog from "../svelteComponents/Dialog.svelte";
  import InfoToolTip from "./InfoToolTip.svelte";
  import CreateTemplate from "./CreateTemplate.svelte";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import CustomFieldPicker from "./CustomFieldPicker.svelte";
  import ImageSelector from "./ImageSelector.svelte";
  import { createItemStore } from "../stores/itemInfoStore.js";

  export let dialog: HTMLDialogElement;

  createItemStore.update(current => ({
    ...current,
    dialog: dialog,
  }))
</script>

<Dialog isLarge={true} bind:dialog on:close={createItemStore.resetForm}>
  <h1 id="underline-header" class="font-bold text-center">Create New Item</h1>
  <div class="page-component large-dialog-internal">
    <form on:submit|preventDefault={createItemStore.handleCreateItem}>
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4">
          <!-- Name -->
          <label class="flex-column flex-grow">
            Name (required):
            <input
              class="dark-textarea py-2 px-4 w-full"
              type="text"
              placeholder="Toolbox"
              bind:value={$createItemStore.name}
              required
            />
          </label>

          <!-- Tags -->
          <label class="flex-column flex-grow">
            Tags:
            <textarea
              rows="1"
              id="resize-none-textarea"
              class="dark-textarea py-2 px-4 w-full"
              bind:value={$createItemStore.tags}
            />
          </label>
        </div>

        <!-- Description -->
        <label class="min-w-[400px]">
          Description:
          <textarea
            rows="4"
            id="resize-none-textarea"
            class="dark-textarea py-2 px-4 w-full"
            placeholder="My medium-sized, red toolbox"
            bind:value={$createItemStore.description}
          />
        </label>

        <br />
        <div class="flex flex-col space-y-2">
          <ImageSelector on:imageChange={handleImageChange} />
        </div>
        <br />

        <SlideToggle
          name="slide"
          bind:checked={$createItemStore.sameLocations}
          active="toggle-background"
          >Item is currently at its home location</SlideToggle
        >
        <div class="flex space-x-4">
          <!-- Parent Item -->
          {#if !$createItemStore.sameLocations}
            <label class="flex-column flex-grow relative">
              <div class="flex items-center gap-2">
                <span>Current Location:</span>
                <InfoToolTip
                  message="Where an item currently is, e.g. a shirt's parent item may be a suitcase."
                />
              </div>
              <input
                type="text"
                class="dark-textarea py-2 px-4 w-full"
                bind:value={$createItemStore.parentItemName}
                on:input={handleParentItemInput}
                on:focus={handleParentItemFocus}
                on:blur={() => ($createItemStore.parentItemSuggestions = [])}
              />
              {#if $createItemStore.parentItemSuggestions.length > 0}
                <ul class="suggestions suggestion-box">
                  {#each $createItemStore.parentItemSuggestions as item}
                    <button
                      class="suggestion-item"
                      type="button"
                      on:mousedown={(e) => {
                        e.preventDefault();
                        selectParentItem(item);
                      }}
                    >
                      {item.name}
                    </button>
                  {/each}
                </ul>
              {/if}
            </label>
          {/if}

          <!-- Home Item -->
          <label class="flex-column flex-grow relative">
            <div class="flex items-center gap-2">
              <span>Home Location:</span>
              <InfoToolTip
                message="Where an item should normally be, e.g a shirt's home item may be a drawer."
              />
            </div>
            <input
              type="text"
              class="dark-textarea py-2 px-4 w-full"
              bind:value={$createItemStore.homeItemName}
              on:input={handleHomeItemInput}
              on:focus={handleHomeItemFocus}
              on:blur={() => ($createItemStore.homeItemSuggestions = [])}
            />
            {#if $createItemStore.homeItemSuggestions.length > 0}
              <ul class="suggestions suggestion-box">
                {#each $createItemStore.homeItemSuggestions as item}
                  <button
                    class="suggestion-item"
                    type="button"
                    on:mousedown={(e) => {
                      e.preventDefault();
                      selectHomeItem(item);
                    }}
                  >
                    {item.name}
                  </button>
                {/each}
              </ul>
            {/if}
          </label>
        </div>
        <br />

        <!-- Template Field and Create Template Button -->
        <div class="flex space-x-4 items-center">
          <label class="flex-column flex-grow relative">
            <div class="flex items-center gap-2">
              <span>Template:</span>
              <InfoToolTip
                message="A template is a more narrow category of similar items that share common fields. Select an existing template or create a new one."
              />
            </div>
            <input
              type="text"
              class="dark-textarea py-2 px-4 w-full"
              bind:value={$createItemStore.templateName}
              on:input={handleTemplateInput}
              on:focus={handleTemplateFocus}
              on:blur={() => ($createItemStore.templateSuggestions = [])}
            />
            {#if $createItemStore.templateSuggestions.length > 0}
              <ul class="suggestions suggestion-box">
                {#each $createItemStore.templateSuggestions as t}
                  <button
                    class="suggestion-item"
                    type="button"
                    on:mousedown={(e) => {
                      e.preventDefault();
                      selectTemplate(t);
                    }}
                  >
                    {t.name}
                  </button>
                {/each}
              </ul>
            {/if}
          </label>
          <div>
            <br />
            <button
              type="button"
              class="border-button font-semibold shadow"
              on:click={() => (showCreateTemplateDialog = true)}
            >
              Create New Template
            </button>
          </div>
        </div>
      </div>
      <br />

      <!-- Custom Fields -->
      <div class="simple-flex px-2">
        <h2 class="font-bold text-lg">Custom Fields</h2>
        <button
          type="button"
          class="border-button font-semibold shadow small-add-button"
          on:click={addCustomFieldLine}
        >
          +
        </button>
      </div>
      {#each $createItemStore.customFields as field, index}
        <CustomFieldPicker
          bind:field
          onFieldNameInput={(e) => onCustomFieldNameInput(index, e)}
          onFieldFocus={() => handleCustomFieldFocus(index)}
          onFieldBlur={() => ($createItemStore.customFields[index].suggestions = [])}
          showDeleteButton={!field.fromTemplate}
          onDelete={() => removeCustomField(index)}
        >
          <svelte:fragment slot="suggestions">
            {#each field.suggestions as suggestion}
              <button
                class="suggestion-item"
                type="button"
                on:mousedown={(e) => {
                  e.preventDefault();
                  selectCustomFieldSuggestion(index, suggestion);
                }}
              >
                {suggestion.fieldName} ({suggestion.dataType})
              </button>
            {/each}
          </svelte:fragment>
        </CustomFieldPicker>
      {/each}

      <br />
      <!-- Submit -->
      <div class="flex justify-end">
        <button
          class="success-button font-semibold shadow mt-4 w-full block"
          type="submit"
        >
          Create Item
        </button>
      </div>
    </form>
  </div>
</Dialog>

<!-- Create Template Dialog -->
{#if showCreateTemplateDialog}
  <Dialog
    bind:dialog={templateDialog}
    on:close={() => {
      showCreateTemplateDialog = false;
    }}
  >
    <CreateTemplate
      on:close={() => {
        showCreateTemplateDialog = false;
      }}
    />
  </Dialog>
{/if}
