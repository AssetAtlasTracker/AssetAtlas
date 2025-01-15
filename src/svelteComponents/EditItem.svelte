<script lang="ts">
    import Dialog from '../svelteComponents/Dialog.svelte';
    import InfoToolTip from './InfoToolTip.svelte';
    import { ip } from '../stores/ipStore';
    import CreateTemplate from './CreateTemplate.svelte'; 
    import type { IBasicItemPopulated } from '../models/basicItem';
  
    export let dialog: { showModal: () => any };
    export let item: IBasicItemPopulated;
  
    let templateDialog: HTMLDialogElement | undefined;
  
    let name = item.name;
    let description = item.description;
    let tags = item.tags.toString();
    let parentItemName = '';
    if (item.parentItem?.name != null) {
      parentItemName = item.parentItem?.name;
    }
    let parentItemId: string | null = item.parentItem?.id;
    let parentItemSuggestions: any[] = [];
    let homeItemName = '';
    if (item.homeItem?.name != null) {
      homeItemName = item.homeItem?.name;
    }
    let homeItemId: string | null = item.homeItem?.id;
    let homeItemSuggestions: any[] = [];
    let templateName = '';
    if (item.template) {
      templateName = item.template?.name;
    } 
    let templateId: string | null = item.template?.id;
    let templateSuggestions: any[] = [];
    let debounceTimeout: NodeJS.Timeout | undefined;

  
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
  
    //Start with an empty array by default so no field loads initially
    let customFields: ICustomFieldEntry[] = [];
    if (item.customFields) {
        // customFields = item.customFields;
        console.log(item.customFields);
    }
  
    let showEditTemplateDialog = false;
  
    $: if (showEditTemplateDialog) {
      if (templateDialog) {
        templateDialog.showModal();
      }
      resetForm();
    }
  
    function resetForm() {
      name = '';
      description = '';
      tags = '';
      parentItemName = '';
      parentItemId = null;
      homeItemName = '';
      homeItemId = null;
      templateName = '';
      templateId = null;
      customFields = [];
      parentItemSuggestions = [];
      homeItemSuggestions = [];
      templateSuggestions = [];
    }
    

    async function handleEditItem() {
      //If a template name is typed but not an exact match (no templateId set), block creation
      if (templateName.trim() && !templateId) {
        alert('Please select a valid template from the list or clear the field.');
        return;
      }
  
      const tagsArray = tags.split(',').map(tag => tag.trim());
  
      //Filter out empty fields not from the template
      customFields = customFields.filter(field => {
        if (field.fromTemplate) return true; //Always keep template fields that were loaded
        return field.fieldName.trim() !== '' && field.dataType.trim() !== '';
      });
  
      const formattedCustomFields = await Promise.all(
        customFields.map(async (field) => {
          if (!field.isNew && field.fieldId) {
            return { field: field.fieldId, value: field.value };
          } else {
            const createdField = await createCustomField(field.fieldName, field.dataType);
            return { field: createdField._id, value: field.value };
          }
        })
      );
  
      try {
        const response = await fetch(`http://${$ip}/api/items/${item._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            tags: tagsArray,
            parentItem: parentItemId,
            homeItem: homeItemId,
            template: templateId || null,
            customFields: formattedCustomFields,
          }),
        });
  
        const data = await response.json();
  
        if (!response.ok) throw new Error(data.message || 'Error editing item');
        console.log('Item changed:', data);
  
      } catch (err) {
        console.error('Error editing item:', err);
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
  
    function selectParentItem(item: { name: string; _id: string | null }) {
      parentItemName = item.name;
      parentItemId = item._id;
      parentItemSuggestions = [];
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
        const response = await fetch(`http://${$ip}/api/items/search?name=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        homeItemSuggestions = data;
      } catch (err) {
        console.error('Error searching home items:', err);
      }
    }
  
    function selectHomeItem(item: { name: string; _id: string | null }) {
      homeItemName = item.name;
      homeItemId = item._id;
      homeItemSuggestions = [];
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
        const response = await fetch(`http://${$ip}/api/templates/searchTemplates?name=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        templateSuggestions = data;
  
        //Check for an exact match
        const exactMatch = data.find((template: { name: string }) => template.name === templateName);
  
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
        console.error('Error searching templates:', err);
      }
    }
  
    function selectTemplate(item: { name: string; _id: string }) {
      templateName = item.name;
      templateId = item._id;
      templateSuggestions = [];
      loadTemplateFields(templateId);
    }
  
    async function loadTemplateFields(templateId: string | null) {
      if (!templateId) return;
  
      try {
        if (!templateName || templateName.trim() === '') {
          return;
        }
  
        console.log(`Fetching template details from: http://${$ip}/api/templates/${templateId}`);
        const response = await fetch(`http://${$ip}/api/templates/${templateId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (!response.ok) {
          console.error(`Failed to fetch template. Status: ${response.status} - ${response.statusText}`);
          console.error(await response.text());
          return;
        }
  
        const data = await response.json();
        console.log('Template data:', data);
  
        if (!data || !data.fields) {
          console.warn('No fields found in template:', data);
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
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
  
            if (!fieldRes.ok) {
              console.error(`Failed to fetch field. Status: ${fieldRes.status} - ${fieldRes.statusText}`);
              console.error(await fieldRes.text());
              throw new Error(`Failed to fetch field with ID: ${fieldId}`);
            }
  
            const fieldData: ICustomField = await fieldRes.json();
            console.log('Field data:', fieldData);
  
            return {
              fieldName: fieldData.fieldName,
              fieldId: fieldData._id,
              dataType: fieldData.dataType,
              value: '',
              suggestions: [],
              isNew: false,
              isSearching: false,
              isExisting: true,
              fromTemplate: true,
            };
          })
        );
  
        console.log('Loaded template fields:', templateFields);
  
        //display template fields before any user-defined fields
        customFields = [...templateFields, ...customFields];
        console.log('Updated customFields:', customFields);
      } catch (err) {
        console.error('Error loading template fields:', err);
      }
    }
  
    //Removes all fields that came from a template
    function removeTemplateFields() {
      customFields = customFields.filter(f => !f.fromTemplate);
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
          isExisting: false,
          fromTemplate: false
        }
      ];
    }
  
    function removeCustomField(index: number) {
      // Only allow removing if not from template
      if (customFields[index].fromTemplate) return;
      customFields = customFields.filter((_, i) => i !== index);
    }
  
  </script>
  
  <Dialog bind:dialog on:close={resetForm}>
    <h1 id="underline-header" class="font-bold text-center">
      Edit Item
    </h1>
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
              <textarea class="dark-textarea py-2 px-4 w-full" bind:value={tags}/>
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
                on:blur={() => parentItemSuggestions = []}
              />
              {#if parentItemSuggestions.length > 0}
              <ul class="suggestions">
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
  
            <!-- Home Item -->
            <label class="flex-1 min-w-[200px] relative">
              Home Item:
              <InfoToolTip message="Where an item should normally be, e.g a shirt's home item may be a drawer." />
              <input 
                type="text"
                class="dark-textarea py-2 px-4 w-full"
                bind:value={homeItemName}
                on:input={handleHomeItemInput}
                on:blur={() => homeItemSuggestions = []}
              />
              {#if homeItemSuggestions.length > 0}
              <ul class="suggestions">
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
              Template:
              <InfoToolTip message="A template is a more narrow category of similar items that share common fields. Select an existing template or create a new one." />
              <input type="text"
                class="dark-textarea py-2 px-4 w-full"
                bind:value={templateName}
                placeholder={item.template?.name}
                on:input={handleTemplateInput}
                on:blur={() => templateSuggestions = []} 
              />
              {#if templateSuggestions.length > 0}
              <ul class="suggestions">
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
              on:click={() => showEditTemplateDialog = true}>
              Create New Template
            </button>
          </div>
        </div>
  
        <!-- Custom Fields -->
        <h2 class="font-bold text-lg mt-4">
          Custom Fields
        </h2>
        <div class="space-y-2">
          {#each customFields as field, index}
            <div class="flex flex-wrap items-start mb-4 border p-2 relative">
              <!-- If fromTemplate, do not show delete button -->
              {#if !field.fromTemplate}
                <button
                  type="button"
                  class="delete-button text-warning-500 font-bold mr-4"
                  on:click={() => removeCustomField(index)}>
                  X
                </button>
              {/if}
              <label class="flex-1 mr-2">
                Field Name:
                <input
                  type="text"
                  class="dark-textarea py-2 px-4 w-full"
                  bind:value={field.fieldName}
                  on:input={(e) => onCustomFieldNameInput(index, e)}
                  on:blur={() => customFields[index].suggestions = []}
                  disabled={field.fromTemplate}
                />
                {#if field.suggestions.length > 0}
                  <ul class="suggestions bg-white border shadow mt-1 max-h-32 overflow-auto">
                    {#each field.suggestions as suggestion}
                      <button 
                        type="button"
                        class="px-2 py-1 hover:bg-primary-900 cursor-pointer" 
                        on:mousedown={(e) => { e.preventDefault(); selectCustomFieldSuggestion(index, suggestion); }}>
                        {suggestion.fieldName} ({suggestion.dataType})
                      </button>
                    {/each}
                  </ul>
                {/if}
              </label>
              <!-- TODO: Change these to not use "style="-->
              <label class="mr-2" style="flex-basis: 50%; max-width: 200px;">
                Data Type:
                <select
                  class="dark-textarea py-2 px-4 w-full"
                  bind:value={field.dataType}
                  disabled={field.isExisting || field.fromTemplate}>
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
        <button type="button" class="border-button hover:bg-primary-900 font-semibold shadow mt-2" on:click={addCustomFieldLine}>
          Add Custom Field
        </button>
        <!-- Submit -->
        <button class="border-button hover:bg-primary-900 font-semibold shadow mt-4 block" type="submit">
          Submit Changes
        </button>
      </form>
    </div>
  </Dialog>
  
  {#if showEditTemplateDialog}
    <Dialog bind:dialog={templateDialog} on:close={() => { showEditTemplateDialog = false; resetForm(); }}>
      <CreateTemplate on:close={() => { showEditTemplateDialog = false; resetForm(); }}/>
    </Dialog>
  {/if}