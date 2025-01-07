<script lang="ts">
  import { ip } from "../stores/ipStore";

  import "../svelteStyles/main.css";

  let name = "";
  let customFields: ICustomFieldEntry[] = [];
  let nameError = "";
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

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
    suggestions: ICustomField[];
    isNew: boolean;
    isSearching: boolean;
    searchTimeout?: ReturnType<typeof setTimeout>;
    isExisting: boolean;
  }

  async function handleCreateTemplate() {
    //Filter out empty fields before submission
    customFields = customFields.filter(
      (field) => field.fieldName.trim() !== "" && field.dataType.trim() !== "",
    );

    const formattedCustomFields = await Promise.all(
      customFields.map(async (field) => {
        if (!field.isNew && field.fieldId) {
          //If it's an existing field, just return its ID
          return field.fieldId;
        } else {
          //If it's a new field, create it
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
        `http://${$ip}/api/templates/createTemplate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            fields: formattedCustomFields,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error creating template");
      }

      const data = await response.json();
      console.log("Template created:", data);

      //Reset form
      name = "";
      nameError = "";
      customFields = [];
    } catch (err) {
      console.error("Error creating template:", err);
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
        //Check if is an EXACT match
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
  <h2 class="font-bold text-xl mb-4">Create New Template</h2>
  <form on:submit|preventDefault={handleCreateTemplate}>
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
        <!-- Field Name & Suggestions -->
        <label class="flex-grow mr-2 relative">
          Field Name:
          <input
            type="text"
            placeholder="Field Name"
            class="dark-textarea py-2 px-4 w-full"
            bind:value={field.fieldName}
            on:input={(e) => onCustomFieldNameInput(index, e)}
            on:blur={() => (customFields[index].suggestions = [])}
          />
          {#if field.suggestions.length > 0}
            <ul class="suggestions">
              {#each field.suggestions.slice(0, 5) as suggestion}
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

        <!-- Data Type -->
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

        <!-- Remove Button -->
        <button
          type="button"
          class="border-button hover:bg-gray-100 font-semibold shadow ml-2"
          on:click={() => removeCustomField(index)}
        >
          Remove
        </button>
      </div>
    {/each}

    <button
      type="button"
      class="border-button hover:bg-gray-100 font-semibold shadow mt-2"
      on:click={addCustomFieldLine}
    >
      Add Custom Field
    </button>
    <button
      type="submit"
      class="border-button hover:bg-gray-100 font-semibold shadow mt-4"
      disabled={!!nameError}>Create Template</button
    >
  </form>
</div>
