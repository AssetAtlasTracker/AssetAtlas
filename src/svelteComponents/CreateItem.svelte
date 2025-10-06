<script lang="ts">
  import Dialog from "../svelteComponents/Dialog.svelte";
  import InfoToolTip from "./InfoToolTip.svelte";
  import CreateTemplate from "./CreateTemplate.svelte";
  import { actionStore } from "../stores/actionStore.js";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import CustomFieldPicker from "./CustomFieldPicker.svelte";
  import ImageSelector from "./ImageSelector.svelte";
  import { createEventDispatcher } from 'svelte';

  import "../svelteStyles/main.css";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import { createItemStore } from "../stores/itemInfoStore.js";
  import type { ICustomField } from "../stores/itemInfoStore.js";

  export let dialog: HTMLDialogElement;

  let templateDialog: HTMLDialogElement | undefined;

  export let item: IBasicItemPopulated | null;
  export let duplicate = false;

  const dispatch = createEventDispatcher();

  export function changeItem(newItem: IBasicItemPopulated){
    if (duplicate) {
      $createItemStore.name = newItem.name;
      if (newItem.description) {
        $createItemStore.description = newItem.description;
      }
      $createItemStore.tags = newItem.tags.toString();
      if (newItem.parentItem?.name != null) {
      $createItemStore.parentItemName = newItem.parentItem?.name;
      }
      if (newItem.parentItem) {
        $createItemStore.parentItemId = newItem.parentItem._id.toString();
      }
      if (newItem.homeItem?.name != null) {
        $createItemStore.homeItemName = newItem.homeItem?.name;
      }
      if (newItem.homeItem) {
        $createItemStore.homeItemId = newItem.homeItem._id.toString();
      }
      if (newItem.template) {
        $createItemStore.templateName = newItem.template?.name;
        $createItemStore.templateId = newItem.template?._id.toString();
      }
    }
  }

  if (item != null) {
    $createItemStore.homeItemName = item.name;
    $createItemStore.homeItemId = item._id.toString();
    if (duplicate) {
      $createItemStore.name = item.name;
      if (item.description) {
        $createItemStore.description = item.description;
      }
      $createItemStore.tags = item.tags.toString();
      if (item.parentItem?.name != null) {
      $createItemStore.parentItemName = item.parentItem?.name;
      }
      if (item.parentItem) {
        $createItemStore.parentItemId = item.parentItem._id.toString();
      }
      if (item.homeItem?.name != null) {
        $createItemStore.homeItemName = item.homeItem?.name;
      }
      if (item.homeItem) {
        $createItemStore.homeItemId = item.homeItem._id.toString();
      }
      if (item.template) {
        $createItemStore.templateName = item.template?.name;
        $createItemStore.templateId = item.template?._id.toString();
      }
    }
  }

  let showCreateTemplateDialog = false;

  $: if (showCreateTemplateDialog) {
    if (templateDialog) {
      templateDialog.showModal();
    }
  }

  function resetForm() {
    $createItemStore.name = "";
    $createItemStore.description = "";
    $createItemStore.tags = "";
    $createItemStore.parentItemName = "";
    $createItemStore.parentItemId = null;
    $createItemStore.homeItemName = "";
    $createItemStore.homeItemId = null;
    $createItemStore.templateName = "";
    $createItemStore.templateId = null;
    $createItemStore.customFields = [];
    $createItemStore.parentItemSuggestions = [];
    $createItemStore.homeItemSuggestions = [];
    $createItemStore.templateSuggestions = [];
    $createItemStore.selectedImage = null;
    $createItemStore.removeExistingImage = false;
  }

  async function handleCreateItem() {
    try {
      //If a template name is typed but not an exact match (no templateId set), block creation
      if ($createItemStore.templateName.trim() && !$createItemStore.templateId) {
        alert(
          "Please select a valid template from the list or clear the field.",
        );
        return;
      }

      const tagsArray = $createItemStore.tags.split(",").map((tag) => tag.trim());

      if ($createItemStore.sameLocations) {
        $createItemStore.parentItemId = $createItemStore.homeItemId;
        $createItemStore.parentItemName = $createItemStore.homeItemName;
      }

      //Filter out empty fields not from the template
      $createItemStore.customFields = $createItemStore.customFields.filter((field) => {
        if (field.fromTemplate) return true; //Always keep template fields that were loaded
        return field.fieldName.trim() !== "" && field.dataType.trim() !== "";
      });

      const formattedCustomFields = await Promise.all(
        $createItemStore.customFields.map(async (field) => {
          if (!field.isNew && field.fieldId) {
            return { field: field.fieldId, value: field.value };
          } else {
            const createdField = await createCustomField(
              field.fieldName,
              field.dataType,
            );
            return { field: createdField._id, value: field.value };
          }
        }),
      );

      const formData = new FormData();
      formData.append("name", $createItemStore.name);
      formData.append("description", $createItemStore.description);
      formData.append("tags", JSON.stringify(tagsArray));
      if ($createItemStore.parentItemId) formData.append("parentItem", $createItemStore.parentItemId);
      if ($createItemStore.homeItemId) formData.append("homeItem", $createItemStore.homeItemId);
      if ($createItemStore.templateId) formData.append("template", $createItemStore.templateId);
      formData.append("customFields", JSON.stringify(formattedCustomFields));
      if ($createItemStore.selectedImage) formData.append("image", $createItemStore.selectedImage);

      console.log("Sending request with formData:");
      for (const pair of (formData as any).entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await fetch(`/api/items`, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:");
      response.headers.forEach((value, key) => {
        console.log(key, value);
      });

      // Try to get the raw text first
      const rawText = await response.text();
      console.log("Raw response:", rawText);

      // Then parse it as JSON
      const data = JSON.parse(rawText);

      if (!response.ok) {
        actionStore.addMessage("Error creating item");
        throw new Error(data.message || "Error creating item");
      }
      console.log("Item created:", data);
      actionStore.addMessage("Item created successfully!");
      dialog.close();
      dispatch('itemCreated'); //triggers action display stuff

      //Reset the form after successful creation
      resetForm();
    } catch (err) {
      console.error("Error creating item:", err);
      actionStore.addMessage("Error creating item");
    }
  }

  async function createCustomField(
    fieldName: string,
    dataType: string,
  ): Promise<ICustomField> {
    const response = await fetch(`/api/customFields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldName, dataType }),
    });
    return await response.json();
  }

  //Parent item search handlers
  function handleParentItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.parentItemName = target.value;
    $createItemStore.parentItemId = null;
    if ($createItemStore.debounceTimeout) clearTimeout($createItemStore.debounceTimeout);
    $createItemStore.debounceTimeout = setTimeout(() => {
      searchParentItems($createItemStore.parentItemName);
    }, 300);
  }

  async function searchParentItems(query: string) {
    try {
      const response = await fetch(
        `/api/items/search?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      $createItemStore.parentItemSuggestions = data;
    } catch (err) {
      console.error("Error searching parent items:", err);
    }
  }

  async function addToRecents(type: string, item: any) {
    console.log("DEBUG - addToRecents called with:", { type, item });
    try {
      const body = JSON.stringify({
        type,
        itemId: item._id,
      });
      console.log("DEBUG - Request body:", body);

      const response = await fetch(`/api/recentItems/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to add to recents: ${responseText}`);
      }
    } catch (err) {
      console.error("Error adding to recents:", err);
    }
  }

  function selectParentItem(item: { name: string; _id: string | null }) {
    $createItemStore.parentItemName = item.name;
    $createItemStore.parentItemId = item._id;
    $createItemStore.parentItemSuggestions = [];
    if (item && item._id) {
      addToRecents("items", item);
    }
  }

  function selectHomeItem(item: { name: string; _id: string | null }) {
    $createItemStore.homeItemName = item.name;
    $createItemStore.homeItemId = item._id;
    $createItemStore.homeItemSuggestions = [];
    if (item && item._id) {
      addToRecents("items", item);
    }
  }

  function selectTemplate(item: { name: string; _id: string }) {
    $createItemStore.templateName = item.name;
    $createItemStore.templateId = item._id;
    $createItemStore.templateSuggestions = [];
    loadTemplateFields($createItemStore.templateId);
    if (item && item._id) {
      addToRecents("templates", item);
    }
  }

  async function loadTemplateFields(templateId: string | null) {
    if (!templateId) return;

    try {
      if (!$createItemStore.templateName || $createItemStore.templateName.trim() === "") {
        return;
      }
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch template. Status: ${response.status} - ${response.statusText}`,
        );
        console.error(await response.text());
        return;
      }

      const data = await response.json();
      console.log("Template data:", data);

      if (!data || !data.fields) {
        console.warn("No fields found in template:", data);
        return;
      }

      //Remove existing template fields before loading new ones
      removeTemplateFields();

      //Add the template fields
      console.log(`Fetching details for ${data.fields.length} fields.`);
      const templateFields = await Promise.all(
        data.fields.map(async (field: { _id: string }) => {
          const fieldId = field._id;
          const fieldUrl = `/api/customFields/${fieldId}`;
          console.log(`Fetching field details from: ${fieldUrl}`);

          const fieldRes = await fetch(fieldUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (!fieldRes.ok) {
            console.error(
              `Failed to fetch field. Status: ${fieldRes.status} - ${fieldRes.statusText}`,
            );
            console.error(await fieldRes.text());
            throw new Error(`Failed to fetch field with ID: ${fieldId}`);
          }

          const fieldData: ICustomField = await fieldRes.json();
          console.log("Field data:", fieldData);

          return {
            fieldName: fieldData.fieldName,
            fieldId: fieldData._id,
            dataType: fieldData.dataType,
            value: "",
            suggestions: [],
            isNew: false,
            isSearching: false,
            isExisting: true,
            fromTemplate: true,
          };
        }),
      );

      console.log("Loaded template fields:", templateFields);

      //display template fields before any user-defined fields
      $createItemStore.customFields = [...templateFields, ...$createItemStore.customFields];
      console.log("Updated customFields:", $createItemStore.customFields);
    } catch (err) {
      console.error("Error loading template fields:", err);
    }
  }

  //Removes all fields that came from a template
  function removeTemplateFields() {
    $createItemStore.customFields = $createItemStore.customFields.filter((f) => !f.fromTemplate);
  }

  //Custom fields handlers
  function onCustomFieldNameInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.customFields[index].fieldName = target.value;
    $createItemStore.customFields[index].fieldId = undefined;
    $createItemStore.customFields[index].isNew = true;
    $createItemStore.customFields[index].isExisting = false;
    searchForCustomFields(index);
  }

  function searchForCustomFields(index: number) {
    if ($createItemStore.customFields[index].searchTimeout)
      clearTimeout($createItemStore.customFields[index].searchTimeout);

    $createItemStore.customFields[index].searchTimeout = setTimeout(async () => {
      const query = $createItemStore.customFields[index].fieldName.trim();
      if (query.length === 0) {
        $createItemStore.customFields[index].suggestions = [];
        return;
      }

      try {
        const response = await fetch(
          `/api/customFields/search?fieldName=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data: ICustomField[] = await response.json();
        $createItemStore.customFields[index].suggestions = data;
      } catch (error) {
        console.error("Error searching custom fields:", error);
      }
    }, 300);
  }

  function selectCustomFieldSuggestion(
    index: number,
    suggestion: ICustomField,
  ) {
    $createItemStore.customFields[index].fieldName = suggestion.fieldName;
    $createItemStore.customFields[index].fieldId = suggestion._id;
    $createItemStore.customFields[index].dataType = suggestion.dataType;
    $createItemStore.customFields[index].isNew = false;
    $createItemStore.customFields[index].isExisting = true;
    $createItemStore.customFields[index].suggestions = [];
    if (suggestion && suggestion._id) {
      addToRecents("customFields", suggestion);
    }
  }

  function addCustomFieldLine() {
    $createItemStore.customFields = [
      ...$createItemStore.customFields,
      {
        fieldName: "",
        fieldId: undefined,
        dataType: "string",
        value: "",
        suggestions: [],
        isNew: true,
        isSearching: false,
        isExisting: false,
        fromTemplate: false,
      },
    ];
  }

  function removeCustomField(index: number) {
    // Only allow removing if not from template
    if ($createItemStore.customFields[index].fromTemplate) return;
    $createItemStore.customFields = $createItemStore.customFields.filter((_, i) => i !== index);
  }

  function handleImageChange(event: CustomEvent) {
    const { selectedImage: newImage, removeExistingImage: remove } =
      event.detail;
    $createItemStore.selectedImage = newImage;
    $createItemStore.removeExistingImage = remove;
  }

  async function loadRecentItems(type: string) {
    try {
      const response = await fetch(`/api/recentItems/${type}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error loading recent items:", err);
      return [];
    }
  }

  async function handleParentItemFocus() {
    if (!$createItemStore.parentItemName) {
      $createItemStore.parentItemSuggestions = await loadRecentItems("items");
    }
  }

  async function handleHomeItemFocus() {
    if (!$createItemStore.homeItemName) {
      $createItemStore.homeItemSuggestions = await loadRecentItems("items");
    }
  }

  async function handleTemplateFocus() {
    if (!$createItemStore.templateName) {
      $createItemStore.templateSuggestions = await loadRecentItems("templates");
    }
  }

  async function handleCustomFieldFocus(index: number) {
    if (!$createItemStore.customFields[index].fieldName) {
      $createItemStore.customFields[index].suggestions = await loadRecentItems("customFields");
    }
  }

  async function handleCustomFieldClick(index: number) {
    if (!$createItemStore.customFields[index].fieldName) {
      $createItemStore.customFields[index].suggestions = await loadRecentItems("customFields");
    }
  }

  //Home item search handlers
  function handleHomeItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.homeItemName = target.value;
    $createItemStore.homeItemId = null;
    if ($createItemStore.debounceTimeout) clearTimeout($createItemStore.debounceTimeout);
    $createItemStore.debounceTimeout = setTimeout(() => {
      searchHomeItems($createItemStore.homeItemName);
    }, 300);
  }

  function handleTemplateInput(event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.templateName = target.value;
    $createItemStore.templateId = null;
    if ($createItemStore.debounceTimeout) clearTimeout($createItemStore.debounceTimeout);
    $createItemStore.debounceTimeout = setTimeout(() => {
      searchTemplates($createItemStore.templateName);
    }, 300);
  }

  async function searchHomeItems(query: string) {
    try {
      const response = await fetch(
        `/api/items/search?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      $createItemStore.homeItemSuggestions = data;
    } catch (err) {
      console.error("Error searching home items:", err);
    }
  }

  async function searchTemplates(query: string) {
    try {
      const response = await fetch(
        `/api/templates/searchTemplates?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      $createItemStore.templateSuggestions = data;

      //Check for an exact match
      const exactMatch = data.find(
        (template: { name: string }) => template.name === $createItemStore.templateName,
      );

      if (exactMatch) {
        if ($createItemStore.templateId !== exactMatch._id) {
          $createItemStore.templateId = exactMatch._id;
          await loadTemplateFields($createItemStore.templateId);
        }
      } else {
        $createItemStore.templateId = null;
        removeTemplateFields();
      }
    } catch (err) {
      console.error("Error searching templates:", err);
    }
  }
</script>

<Dialog isLarge={true} bind:dialog on:close={resetForm}>
  <h1 id="underline-header" class="font-bold text-center">Create New Item</h1>
  <div class="page-component large-dialog-internal">
    <form on:submit|preventDefault={handleCreateItem}>
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
