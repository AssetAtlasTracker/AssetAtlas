<script lang="ts">
  import InfoToolTip from "./InfoToolTip.svelte";
  import { ip } from "../stores/ipStore.js";
  import { actionStore } from "../stores/actionStore.js";
  import CreateTemplate from "./CreateTemplate.svelte";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import { navigate } from "svelte-routing";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import CustomFieldPicker from "./CustomFieldPicker.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import ImageSelector from "./ImageSelector.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";

  export let item: IBasicItemPopulated;

  console.log("EditItem component mounted");
  console.log("Received item:", item);

  onMount(() => {
    console.log("EditItem onMount");
    console.log("Item data:", item);
  });

  let templateDialog: HTMLDialogElement | undefined;

  let name = item.name;
  let description = item.description;
  let tags = item.tags.toString();
  let parentItemName = "";
  if (item.parentItem?.name != null) {
    parentItemName = item.parentItem?.name;
  }
  let parentItemId: string | null = null;
  if (item.parentItem) {
    parentItemId = item.parentItem._id.toString();
  }
  let parentItemSuggestions: any[] = [];
  let homeItemName = "";
  if (item.homeItem?.name != null) {
    homeItemName = item.homeItem?.name;
  }
  let homeItemId: string | null = null;
  if (item.homeItem) {
    homeItemId = item.homeItem._id.toString();
  }
  let homeItemSuggestions: any[] = [];
  let templateName = "";
  let templateId: string | null = null;
  if (item.template) {
    templateName = item.template?.name;
    templateId = item.template?._id.toString();
  }
  let templateSuggestions: any[] = [];
  let selectedImage: File | null = null;
  let imagePreview: string | null = null;
  if (item.image) {
    imagePreview = `http://${$ip}/api/items/${item._id}/image`;
  }
  let debounceTimeout: NodeJS.Timeout | undefined;
  let removeExistingImage = false;
  let sameLocations: boolean = false;

  console.log(homeItemId);

  interface ICustomField {
    _id: string;
    fieldName: string;
    dataType: string;
    createdAt: string;
  }

  interface ICustomFieldEntry {
    fieldName: string;
    fieldId?: string;
    dataType: string;
    value: string;
    suggestions: ICustomField[];
    isNew: boolean;
    isSearching: boolean;
    isExisting: boolean;
    fromTemplate: boolean;
    searchTimeout?: NodeJS.Timeout;
  }

  let customFields: ICustomFieldEntry[] = [];
  if (item.customFields?.length) {
    //First load non-template fields
    let nonTemplateFields = item.customFields.map((cf) => ({
      fieldName: cf.field.fieldName,
      fieldId: cf.field._id as string,
      dataType: cf.field.dataType,
      value: cf.value as string,
      suggestions: [],
      isNew: false,
      isSearching: false,
      isExisting: true,
      fromTemplate: false,
    }));

    if (item.template && item.template.fields?.length) {
      const templateFieldIds = new Set(
        item.template.fields.map((tid: any) =>
          typeof tid === "string" ? tid : tid._id.toString(),
        ),
      );

      //Split fields into template and non-template
      const templateFields = nonTemplateFields
        .filter(
          (field) =>
            field.fieldId && templateFieldIds.has(field.fieldId.toString()),
        )
        .map((field) => ({ ...field, fromTemplate: true }));

      const remainingFields = nonTemplateFields.filter(
        (field) =>
          !field.fieldId || !templateFieldIds.has(field.fieldId.toString()),
      );

      //Combine with template fields first
      customFields = [...templateFields, ...remainingFields];
    } else {
      customFields = nonTemplateFields;
    }
  }

  if (item.template && item.template.fields?.length) {
    const templateFieldIds = new Set(
      item.template.fields.map((tid: any) =>
        typeof tid === "string" ? tid : tid._id.toString(),
      ),
    );

    customFields = customFields.map((field) => ({
      ...field,
      fromTemplate: field.fieldId
        ? templateFieldIds.has(field.fieldId.toString())
        : false,
    }));
  }

  if (item.image) {
    getImage();
  }

  let showEditTemplateDialog = false;

  $: if (showEditTemplateDialog) {
    if (templateDialog) {
      templateDialog.showModal();
    }
  }

  const dispatch = createEventDispatcher();

  function resetForm() {}

  async function getImage() {
    try {
      const response = await fetch(`http://${$ip}/api/items/${item._id}/image`);
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      imagePreview = URL.createObjectURL(blob);
    } catch (err) {
      console.error("Error fetching image:", err);
    }
  }

  async function createCustomField(
    fieldName: string,
    dataType: string,
  ): Promise<ICustomField> {
    const response = await fetch(`http://${$ip}/api/customFields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldName, dataType }),
    });
    return await response.json();
  }

  //Parent item search handlers
  function handleParentItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    parentItemName = target.value;
    parentItemId = null;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchParentItems(parentItemName);
    }, 300);
  }

  async function searchParentItems(query: string) {
    try {
      const response = await fetch(
        `http://${$ip}/api/items/search?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      parentItemSuggestions = data;
    } catch (err) {
      console.error("Error searching parent items:", err);
    }
  }

  async function addToRecents(type: string, item: any) {
    console.log("Adding to recents:", type, item); // Add debug logging
    try {
      await fetch(`http://${$ip}/api/recentItems/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          itemId: item._id,
        }),
      });
    } catch (err) {
      console.error("Error adding to recents:", err);
    }
  }

  function selectParentItem(item: { name: string; _id: string | null }) {
    parentItemName = item.name;
    parentItemId = item._id;
    parentItemSuggestions = [];
    if (item._id) addToRecents("items", item);
  }

  //Home item search handlers
  function handleHomeItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    homeItemName = target.value;
    homeItemId = null;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchHomeItems(homeItemName);
    }, 300);
  }

  async function searchHomeItems(query: string) {
    try {
      const response = await fetch(
        `http://${$ip}/api/items/search?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      homeItemSuggestions = data;
    } catch (err) {
      console.error("Error searching home items:", err);
    }
  }

  function selectHomeItem(item: { name: string; _id: string | null }) {
    homeItemName = item.name;
    homeItemId = item._id;
    homeItemSuggestions = [];
    if (item._id) addToRecents("items", item);
  }

  function handleTemplateInput(event: Event) {
    const target = event.target as HTMLInputElement;
    templateName = target.value.trim();
    //Clear templateId since user is typing something else now
    templateId = null;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchTemplates(templateName);
    }, 300);
  }

  async function searchTemplates(query: string) {
    try {
      const response = await fetch(
        `http://${$ip}/api/templates/searchTemplates?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      templateSuggestions = data;

      //Check for an exact match
      const exactMatch = data.find(
        (template: { name: string }) => template.name === templateName,
      );

      if (exactMatch) {
        if (templateId !== exactMatch._id) {
          templateId = exactMatch._id;
          await loadTemplateFields(templateId);
        }
      } else {
        templateId = null;
        removeTemplateFields();
      }
    } catch (err) {
      console.error("Error searching templates:", err);
    }
  }

  function selectTemplate(item: { name: string; _id: string }) {
    templateName = item.name;
    templateId = item._id;
    templateSuggestions = [];
    loadTemplateFields(templateId);
    addToRecents("templates", item);
  }

  async function loadTemplateFields(templateId: string | null) {
    if (!templateId) return;

    try {
      if (!templateName || templateName.trim() === "") {
        return;
      }

      console.log(
        `Fetching template details from: http://${$ip}/api/templates/${templateId}`,
      );
      const response = await fetch(
        `http://${$ip}/api/templates/${templateId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

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
          const fieldUrl = `http://${$ip}/api/customFields/${fieldId}`;
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

      //template fields first, then other fields
      const nonTemplateFields = customFields.filter((f) => !f.fromTemplate);
      customFields = [...templateFields, ...nonTemplateFields];
      console.log("Updated customFields:", customFields);
    } catch (err) {
      console.error("Error loading template fields:", err);
    }
  }

  //Removes all fields that came from a template
  function removeTemplateFields() {
    customFields = customFields.filter((f) => !f.fromTemplate);
  }

  //Custom fields handlers
  function onCustomFieldNameInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    customFields[index].fieldName = target.value;
    customFields[index].fieldId = undefined;
    customFields[index].isNew = true;
    customFields[index].isExisting = false;
    searchForCustomFields(index);
  }

  function searchForCustomFields(index: number) {
    if (customFields[index].searchTimeout)
      clearTimeout(customFields[index].searchTimeout);

    customFields[index].searchTimeout = setTimeout(async () => {
      const query = customFields[index].fieldName.trim();
      if (query.length === 0) {
        customFields[index].suggestions = [];
        return;
      }

      try {
        const response = await fetch(
          `http://${$ip}/api/customFields/search?fieldName=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data: ICustomField[] = await response.json();
        customFields[index].suggestions = data;
      } catch (error) {
        console.error("Error searching custom fields:", error);
      }
    }, 300);
  }

  function selectCustomFieldSuggestion(
    index: number,
    suggestion: ICustomField,
  ) {
    customFields[index].fieldName = suggestion.fieldName;
    customFields[index].fieldId = suggestion._id;
    customFields[index].dataType = suggestion.dataType;
    customFields[index].isNew = false;
    customFields[index].isExisting = true;
    customFields[index].suggestions = [];
    addToRecents("customFields", suggestion);
  }

  function addCustomFieldLine() {
    customFields = [
      ...customFields,
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
    if (customFields[index].fromTemplate) return;
    customFields = customFields.filter((_, i) => i !== index);
  }

  function handleImageChange(event: CustomEvent) {
    const { selectedImage: newImage, removeExistingImage: remove } =
      event.detail;
    selectedImage = newImage;
    removeExistingImage = remove;
  }

  async function loadRecentItems(type: string) {
    try {
      const response = await fetch(`http://${$ip}/api/recentItems/${type}`, {
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
    if (!parentItemName) {
      parentItemSuggestions = await loadRecentItems("items");
    }
  }

  async function handleHomeItemFocus() {
    if (!homeItemName) {
      homeItemSuggestions = await loadRecentItems("items");
    }
  }

  async function handleTemplateFocus() {
    if (!templateName) {
      templateSuggestions = await loadRecentItems("templates");
    }
  }

  async function handleCustomFieldFocus(index: number) {
    if (!customFields[index].fieldName) {
      customFields[index].suggestions = await loadRecentItems("customFields");
    }
  }

  async function handleCustomFieldClick(index: number) {
    if (!customFields[index].fieldName) {
      customFields[index].suggestions = await loadRecentItems("customFields");
    }
  }

  async function checkImageExists() {
    if (!item?._id) return;

    try {
      const response = await fetch(`http://${$ip}/api/items/${item._id}/image`);
      if (response.ok) {
        const timestamp = Date.now();
        imagePreview = `http://${$ip}/api/items/${item._id}/image?t=${timestamp}`;
        removeExistingImage = false;
      } else {
        imagePreview = null;
        removeExistingImage = true;
      }
    } catch (err) {
      console.error("Error checking image:", err);
      imagePreview = null;
      removeExistingImage = true;
    }
  }

  onMount(() => {
    if (item?._id && item.image) {
      checkImageExists();
    }
  });

  async function handleEditItem() {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description || "");
      formData.append(
        "tags",
        JSON.stringify(tags.split(",").map((t) => t.trim())),
      );
      if (parentItemId) formData.append("parentItem", parentItemId);
      if (homeItemId) formData.append("homeItem", homeItemId);
      if (templateId) formData.append("template", templateId);

      // Add custom fields
      const formattedFields = await Promise.all(
        customFields.map(async (field) => {
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
      formData.append("customFields", JSON.stringify(formattedFields));

      // Handle image
      if (removeExistingImage) {
        formData.append("removeImage", "true");
      } else if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch(`http://${$ip}/api/items/${item._id}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update item");

      // Notify parent and close dialog
      dispatch("close");
      actionStore.addMessage("Item updated successfully");
      location.reload();
    } catch (err) {
      console.error("Error updating item:", err);
      actionStore.addMessage("Error updating item");
    }
  }
</script>

<div class="page-component">
  <form on:submit|preventDefault={handleEditItem}>
    <div class="flex flex-col space-y-4">
      <div class="flex flex-wrap space-x-4">
        <!-- Name -->
        <label class="flex-1 min-w-[200px]">
          Name (required):
          <input
            class="dark-textarea py-2 px-4 w-full"
            type="text"
            bind:value={name}
            required
          />
        </label>

        <!-- Tags -->
        <label class="flex-1 min-w-[200px]">
          Tags:
          <textarea class="dark-textarea py-2 px-4 w-full" bind:value={tags} />
        </label>
      </div>

      <!-- Description -->
      <label class="min-w-[400px]">
        Description:
        <textarea
          rows="5"
          class="dark-textarea py-2 px-4 w-full"
          placeholder={item.description}
          bind:value={description}
        />
      </label>

      <ImageSelector
        itemId={item._id.toString()}
        existingImage={!!item.image}
        on:imageChange={handleImageChange}
      />

      <SlideToggle
        name="slide"
        bind:checked={sameLocations}
        active="bg-green-700">Use same home and current location</SlideToggle
      >
      <div class="flex flex-wrap space-x-4">
        <!-- Parent Item -->
        {#if !sameLocations}
          <label class="flex-1 min-w-[200px] relative">
            <div class="flex items-center gap-2">
              <span>Current Location:</span>
              <InfoToolTip
                message="Where an item currently is, e.g. a shirt's parent item may be a suitcase."
              />
            </div>
            <input
              type="text"
              class="dark-textarea py-2 px-4 w-full"
              bind:value={parentItemName}
              on:input={handleParentItemInput}
              on:focus={handleParentItemFocus}
              on:blur={() => (parentItemSuggestions = [])}
            />
            {#if parentItemSuggestions.length > 0}
              <ul class="suggestions suggestion-box">
                {#each parentItemSuggestions as item}
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
        <label class="flex-1 min-w-[200px] relative">
          <div class="flex items-center gap-2">
            <span>Home Location:</span>
            <InfoToolTip
              message="Where an item should normally be, e.g a shirt's home item may be a drawer."
            />
          </div>
          <input
            type="text"
            class="dark-textarea py-2 px-4 w-full"
            bind:value={homeItemName}
            on:input={handleHomeItemInput}
            on:focus={handleHomeItemFocus}
            on:blur={() => (homeItemSuggestions = [])}
          />
          {#if homeItemSuggestions.length > 0}
            <ul class="suggestions suggestion-box">
              {#each homeItemSuggestions as item}
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

      <!-- Template Field and Create Template Button -->
      <div class="flex flex-wrap space-x-4 items-center">
        <label class="flex-1 min-w-[200px] relative">
          <div class="flex items-center gap-2">
            <span>Template:</span>
            <InfoToolTip
              message="A template is a more narrow category of similar items that share common fields. Select an existing template or create a new one."
            />
          </div>
          <input
            type="text"
            class="dark-textarea py-2 px-4 w-full"
            bind:value={templateName}
            placeholder={item.template?.name}
            on:input={handleTemplateInput}
            on:focus={handleTemplateFocus}
            on:blur={() => (templateSuggestions = [])}
          />
          {#if templateSuggestions.length > 0}
            <ul class="suggestions suggestion-box">
              {#each templateSuggestions as t}
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

        <button
          type="button"
          class="border-button hover:bg-primary-900 font-semibold shadow"
          on:click={() => (showEditTemplateDialog = true)}
        >
          Create New Template
        </button>
      </div>
    </div>

    <!-- Custom Fields -->
    <h2 class="font-bold text-lg mt-4">Custom Fields</h2>
    <div class="space-y-2">
      {#each customFields as field, index}
        <div class="field-row">
          <CustomFieldPicker
            bind:field
            onFieldNameInput={(e) => onCustomFieldNameInput(index, e)}
            onFieldFocus={() => handleCustomFieldFocus(index)}
            onFieldBlur={() => (customFields[index].suggestions = [])}
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
        </div>
      {/each}
    </div>

    <button
      type="button"
      class="border-button font-semibold shadow mt-2"
      on:click={addCustomFieldLine}
    >
      Add Custom Field
    </button>
    <!-- Submit -->
    <button
      class="success-button hover:bg-primary-900 font-semibold shadow mt-4 block"
      type="submit"
    >
      Submit Changes
    </button>
  </form>
</div>

{#if showEditTemplateDialog}
  <Dialog
    bind:dialog={templateDialog}
    on:close={() => {
      showEditTemplateDialog = false;
      resetForm();
    }}
  >
    <CreateTemplate
      on:close={() => {
        showEditTemplateDialog = false;
        resetForm();
      }}
    />
  </Dialog>
{/if}
