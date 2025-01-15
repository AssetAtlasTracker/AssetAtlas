<script lang="ts">
  import { ip } from "../stores/ipStore";
  import type { ITemplatePopulated } from "../models/template";
  import type { ICustomField } from "../models/customField";

  export let template: ITemplatePopulated;
  export let onClose: () => void;

  let name = template.name;
  let customFields: ICustomFieldEntry[] = template.fields.map(field => ({
    fieldName: field.fieldName,
    fieldId: field._id as string | undefined,
    dataType: field.dataType,
    suggestions: [],
    isNew: false,
    isSearching: false,
    isExisting: true,
  }));
  let nameError = "";
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

  interface ICustomFieldEntry {
    fieldName: string;
    fieldId?: string;
    dataType: string;
    suggestions: ICustomField[];
    isNew: boolean;
    isSearching: boolean;
    searchTimeout?: ReturnType<typeof setTimeout>;
    isExisting: boolean;
  }

  async function handleEditTemplate() {
    customFields = customFields.filter(
      (field) => field.fieldName.trim() !== "" && field.dataType.trim() !== "",
    );

    const formattedCustomFields = await Promise.all(
      customFields.map(async (field) => {
        if (!field.isNew && field.fieldId) {
          return field.fieldId;
        } else {
          const createdField = await createCustomField(
            field.fieldName,
            field.dataType,
          );
          return createdField._id;
        }
      }),
    );

    try {
      const response = await fetch(
        `http://${$ip}/api/templates/editTemplate/${template._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            fields: formattedCustomFields,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error editing template");
      }

      const data = await response.json();
      console.log("Template edited:", data);

      onClose();
    } catch (err) {
      console.error("Error editing template:", err);
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

  async function loadRecentCustomFields() {
    try {
      const response = await fetch(`http://${$ip}/api/recentItems/customFields`, {  // Changed from /api/recents/ to /api/recentItems/
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error loading recent custom fields:', err);
      return [];
    }
  }

  async function handleCustomFieldFocus(index: number) {
    if (!customFields[index].fieldName) {
      customFields[index].suggestions = await loadRecentCustomFields();
    }
  }

  function selectCustomFieldSuggestion(
    index: number,
    suggestion: ICustomField,
  ) {
    customFields[index].fieldName = suggestion.fieldName;
    customFields[index].fieldId = suggestion._id as string;
    customFields[index].dataType = suggestion.dataType;
    customFields[index].isNew = false;
    customFields[index].isExisting = true;
    customFields[index].suggestions = [];
  }

  function addCustomFieldLine() {
    customFields = [
      ...customFields,
      {
        fieldName: "",
        fieldId: undefined,
        dataType: "string",
        suggestions: [],
        isNew: true,
        isSearching: false,
        isExisting: false,
      },
    ];
  }

  function removeCustomField(index: number) {
    customFields = customFields.filter((_, i) => i !== index);
  }

  async function checkNameUniqueness() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      if (!name.trim()) {
        nameError = "";
        return;
      }

      try {
        const response = await fetch(
          `http://${$ip}/api/templates/searchTemplates?name=${encodeURIComponent(name)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data = await response.json();
        const exactMatch = data.some(
          (template: { name: string }) => template.name === name.trim(),
        );

        nameError = exactMatch ? "Template name already exists" : "";
      } catch (err) {
        console.error("Error checking name uniqueness:", err);
        nameError = "";
      }
    }, 300);
  }
</script>

<div class="template-container">
  <h1 id="underline-header" class="font-bold text-center">Edit Template</h1>
  <form on:submit|preventDefault={handleEditTemplate}>
    <label class="block mb-4">
      Name:
      <input
        type="text"
        class="dark-textarea py-2 px-4 w-full {nameError ? 'error' : ''}"
        bind:value={name}
        on:input={checkNameUniqueness}
        required
      />
      {#if nameError}
        <p class="text-red-500 text-sm mt-1">{nameError}</p>
      {/if}
    </label>

    <h3 class="font-bold text-lg mb-2">Custom Fields</h3>
    {#each customFields as field, index}
      <div class="flex items-start mb-2 relative">
        <label class="flex-grow mr-2 relative">
          Field Name:
          <input
            type="text"
            placeholder="Field Name"
            class="dark-textarea py-2 px-4 w-full"
            bind:value={field.fieldName}
            on:input={(e) => onCustomFieldNameInput(index, e)}
            on:focus={() => handleCustomFieldFocus(index)}
            on:blur={() => (customFields[index].suggestions = [])}
          />
          {#if field.suggestions.length > 0}
            <ul class="suggestions">
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
            </ul>
          {/if}
        </label>
        <!-- TODO: Change these to not use "style="-->
        <label class="mr-2" style="flex-basis: 150px; max-width: 150px;">
          Data Type:
          <select
            class="dark-textarea py-2 px-4 w-full"
            bind:value={field.dataType}
            disabled={field.isExisting}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </label>

        <button
          type="button"
          class="border-button font-semibold shadow ml-2"
          on:click={() => removeCustomField(index)}
        >
          Remove
        </button>
      </div>
    {/each}

    <button
      type="button"
      class="border-button font-semibold shadow mt-2"
      on:click={addCustomFieldLine}
    >
      Add Custom Field
    </button>
    <button
      type="submit"
      class="border-button font-semibold shadow mt-4"
      disabled={!!nameError}>Save</button>
    <button
      type="button"
      class="border-button font-semibold shadow mt-4 ml-2"
      on:click={onClose}>Cancel</button>
  </form>
</div>
