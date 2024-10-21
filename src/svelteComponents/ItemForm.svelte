<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    
    let templates = writable([]); //the templates
    let selectedTemplate = writable('BasicItem'); //Default to BasicItem
    fields = writable([]); //Fields of the current template
    let customFields = writable([]); //User-added custom fields

    onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/templates/getTemplates');
      if (response.ok) {
        const data = await response.json();
        console.log('template data:', data);
        templates.set(data);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  });

  const addCustomField = () => {
    customFields.update(current => [...current, { key: '', valueType: 'string' }]);
  };

  const handleAddItem = async () => {
    const itemData = {
      fields: [...$fields, ...$customFields],
    };

    try {
      const response = await fetch('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        const newItem = await response.json();
        console.log('Item added:', newItem);
      } else {
        console.error('Failed to add item');
      }
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };
</script>

<div>
    {#each $customFields as customField, index}
      <div>
        <label>Custom Field {index + 1}:</label>
        <input type="text" bind:value={customField.key} placeholder="Field Name" />
        <select bind:value={customField.valueType}>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
        </select>
      </div>
    {/each}
  
    <button on:click={addCustomField}>Add Custom Field</button>
  </div>
  
  <div>
    <button on:click={handleAddItem}>Add Item</button>
    <button on:click={() => console.log('Create New Template with Current Fields')}>Create Template</button>
  </div>