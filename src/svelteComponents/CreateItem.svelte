<script lang="ts">
    import Dialog from '../svelteComponents/Dialog.svelte';
    import InfoToolTip from './InfoToolTip.svelte';
    import { ip } from '../stores/ipStore';

    export let dialog: { showModal: () => any };

    let name = '';
    let description = '';
    let tags = '';
    let parentItemName = '';
    let parentItemId: string | null = null;
    let parentItemSuggestions: any[] = [];
    let homeItemName = '';
    let homeItemId: string | null = null;
    let homeItemSuggestions: any[] = [];
    let debounceTimeout: NodeJS.Timeout | undefined;

    interface ICustomField {
      _id: string;
      fieldName: string;
      dataType: string;
      createdAt: string;
    }

    interface ICustomFieldEntry {
      fieldName: string;
      fieldId?: string;   //If existing field chosen
      dataType: string;
      value: string;
      suggestions: ICustomField[];
      isNew: boolean;     //True if user wants to create a new field
      isSearching: boolean;
      searchTimeout?: NodeJS.Timeout;
      isExisting: boolean; //add this to track if the field is from existing suggestion
    }

    //one custom field line by default
    let customFields: ICustomFieldEntry[] = [];

    async function handleCreateItem() {
      customFields = customFields.filter(field => field.fieldName.trim() !== '' && field.dataType.trim() !== '');

      const tagsArray = tags.split(',').map((tag) => tag.trim());
      
      //For each custom field:
      //If isExisting is true, fieldId should be defined already (from suggestion selection).
      //If isNew is true, we send { fieldName, dataType } to create a new one on server side.

      const formattedCustomFields = await Promise.all(
        customFields.map(async (field) => {
          if (!field.isNew && field.fieldId) {
            // Existing field chosen
            return {
              field: field.fieldId,
              value: field.value,
            };
          } else {
            const createdField = await createCustomField(field.fieldName, field.dataType);
            return {
              field: createdField._id,
              value: field.value
            };
          }
        })
      );

      try {
        const response = await fetch(`http://${$ip}/api/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            tags: tagsArray,
            parentItem: parentItemId,
            homeItem: homeItemId,
            customFields: formattedCustomFields,
          }),
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Error creating item');
        console.log('Item created:', data);

        //Reset form
        name = '';
        description = '';
        tags = '';
        parentItemName = '';
        parentItemId = null;
        homeItemName = '';
        homeItemId = null;
        customFields = [
          {
            fieldName: '',
            fieldId: undefined,
            dataType: 'string',
            value: '',
            suggestions: [],
            isNew: true,
            isSearching: false,
            isExisting: false
          }
        ];
      } catch (err) {
        console.error('Error creating item:', err);
      }
    }

    async function createCustomField(fieldName: string, dataType: string): Promise<ICustomField> {
      const response = await fetch(`http://${$ip}/api/customFields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName, dataType })
      });
      return await response.json();
    }

    function handleParentItemInput(event: Event) {
      const target = event.target as HTMLInputElement;
      parentItemName = target.value;
      parentItemId = null; //Reset parentItemId when user types
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        searchParentItems(parentItemName);
      }, 300);
    }

    function handleHomeItemInput(event: Event) {
      const target = event.target as HTMLInputElement;
      homeItemName = target.value;
      homeItemId = null;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        searchHomeItems(homeItemName);
      }, 300);
    }

    async function searchParentItems(query: string) {
      try {
        const response = await fetch(`http://${$ip}/api/items/search?name=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        parentItemSuggestions = data;
      } catch (err) {
        console.error('Error searching parent items:', err);
      }
    }

    async function searchHomeItems(query: string) {
      try {
        const response = await fetch(`http://${$ip}/api/items/search?name=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        homeItemSuggestions = data;
      } catch (err) {
        console.error('Error searching parent items:', err);
      }
    }

    function selectParentItem(item: { name: string; _id: string | null }) {
      parentItemName = item.name;
      parentItemId = item._id;
      parentItemSuggestions = [];
    }

    function selectHomeItem(item: { name: string; _id: string | null }) {
      homeItemName = item.name;
      homeItemId = item._id;
      homeItemSuggestions = [];
    }

    function onCustomFieldNameInput(index: number, event: Event) {
      const target = event.target as HTMLInputElement;
      customFields[index].fieldName = target.value;
      customFields[index].fieldId = undefined;  //Reset fieldId if user types again
      customFields[index].isNew = true;         //Assume new until selected from suggestions
      customFields[index].isExisting = false;
      searchForCustomFields(index);
    }

    function searchForCustomFields(index: number) {
      if (customFields[index].searchTimeout) clearTimeout(customFields[index].searchTimeout);

      customFields[index].searchTimeout = setTimeout(async () => {
        const query = customFields[index].fieldName.trim();
        if (query.length === 0) {
          customFields[index].suggestions = [];
          return;
        }

        try {
          const response = await fetch(`http://${$ip}/api/customFields/search?fieldName=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          const data: ICustomField[] = await response.json();
          customFields[index].suggestions = data;
        } catch (error) {
          console.error('Error searching custom fields:', error);
        }
      }, 300);
    }

    function selectCustomFieldSuggestion(index: number, suggestion: ICustomField) {
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
          fieldName: '',
          fieldId: undefined,
          dataType: 'string',
          value: '',
          suggestions: [],
          isNew: true,
          isSearching: false,
          isExisting: false
        }
      ];
    }

    function removeCustomField(index: number) {
      customFields = customFields.filter((_, i) => i !== index);
    }

</script>

<Dialog bind:dialog on:close={() => console.log('closed')}>
  <h1 id="underline-header" class="font-bold text-center">
    Create New Item
  </h1>
  <div class="rounded page-component">
    <form on:submit|preventDefault={handleCreateItem}>
      <div class="flex flex-col space-y-4">
        <div class="flex flex-wrap space-x-4">
          <!-- Name -->
          <label class="flex-1 min-w-[200px]">
            Name (required):
            <input
              class="dark-textarea py-2 px-4 w-full"
              type="text"
              placeholder="Toolbox"
              bind:value={name}
              required
            />
          </label>

          <!-- Tags -->
          <label class="flex-1 min-w-[200px]">
            Tags (comma separated):
            <textarea
              class="dark-textarea py-2 px-4 w-full"
              bind:value={tags}
            />
          </label>
        </div>

        <!-- Description -->
        <label class="min-w-[400px]">
          Description:
          <textarea
            rows="5"
            class="dark-textarea py-2 px-4 w-full"
            placeholder="My medium-sized, red toolbox"
            bind:value={description}
          />
        </label>

        <div class="flex flex-wrap space-x-4">
          <!-- Parent Item -->
          <label class="flex-1 min-w-[200px] relative">
            Parent Item:
            <InfoToolTip message="Where an item currently is, e.g. a shirt's parent item may be a suitcase." />
            <input
              type="text"
              class="dark-textarea py-2 px-4 w-full"
              bind:value={parentItemName}
              on:input={handleParentItemInput}
            />
            {#if parentItemSuggestions.length > 0}
              <ul class="suggestions">
                {#each parentItemSuggestions.slice(0, 5) as item}
                  <li on:click={() => selectParentItem(item)}>
                    {item.name}
                  </li>
                {/each}
              </ul>
            {/if}
          </label>

          <!-- Home Item -->
          <label class="flex-1 min-w-[200px] relative">
            Home Item:
            <InfoToolTip message="Where an item should normally be, e.g a shirt's home item may be a drawer." />
            <input
              type="text"
              class="dark-textarea py-2 px-4 w-full"
              bind:value={homeItemName}
              on:input={handleHomeItemInput}
            />
            {#if homeItemSuggestions.length > 0}
              <ul class="suggestions">
                {#each homeItemSuggestions.slice(0, 5) as item}
                  <li on:click={() => selectHomeItem(item)}>
                    {item.name}
                  </li>
                {/each}
              </ul>
            {/if}
          </label>
        </div>
      </div>

      <!-- Custom Fields -->
      <h2 class="font-bold text-lg mt-4">Custom Fields</h2>
      <div class="space-y-2">
        {#each customFields as field, index}
          <div class="flex flex-wrap items-start mb-4 border p-2 rounded relative">
            <button
              type="button"
              class="delete-button text-red-600 font-bold mr-4"
              on:click={() => removeCustomField(index)}
            >
              X
            </button>
            <label class="flex-1 mr-2">
              Field Name:
              <input
                type="text"
                class="dark-textarea py-2 px-4 w-full"
                bind:value={field.fieldName}
                on:input={(e) => onCustomFieldNameInput(index, e)}
              />
              {#if field.suggestions.length > 0}
                <ul class="suggestions bg-white border rounded shadow mt-1 max-h-32 overflow-auto">
                  {#each field.suggestions.slice(0, 5) as suggestion}
                    <li class="px-2 py-1 hover:bg-gray-100 cursor-pointer" on:click={() => selectCustomFieldSuggestion(index, suggestion)}>
                      {suggestion.fieldName} ({suggestion.dataType})
                    </li>
                  {/each}
                </ul>
              {/if}
            </label>
            <label class="mr-2" style="flex-basis: 50%; max-width: 200px;">
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
            <label class="flex-1">
              Value:
              <input
                type="text"
                class="dark-textarea py-2 px-4 w-full"
                bind:value={field.value}
              />
            </label>
          </div>
        {/each}
      </div>
      <button type="button" class="border-button hover:bg-gray-100 font-semibold shadow mt-2" on:click={addCustomFieldLine}>
        Add Custom Field
      </button>

      <!-- Submit -->
      <button class="border-button hover:bg-gray-100 font-semibold shadow mt-4 block" type="submit">
        Create Item
      </button>
    </form>
  </div>
</Dialog>

<style>
  .suggestions {
    list-style: none;
    padding: 0;
    margin: 0;
    position: absolute;
    z-index: 10;
    background: white;
  }
  .suggestions li {
    padding: 4px 8px;
    cursor: pointer;
  }

  .delete-button {
    background: none;
    border: none;
    cursor: pointer;
  }

  .delete-button:hover {
    color: red;
  }
</style>