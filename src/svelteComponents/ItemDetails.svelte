<script lang="ts">
    import { Link } from 'svelte-routing';
    export let item: Record<string, unknown>;
  
    interface Item {
      name: string;
      parentItem?: Item | null;
    }
    
    function displayValue(value: unknown): string {
      if (Array.isArray(value)) {
        return value.map((v) => displayValue(v)).join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2); //Pretty-print JSON
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return String(value);
      } else {
        return '';
      }
    }
  
    interface CustomField {
      field: {
        name: string;
      };
      value: unknown;
    }
  
    function getCustomFields(value: unknown): CustomField[] {
      if (Array.isArray(value) && value.every((v) => isCustomField(v))) {
        return value as CustomField[];
      }
      return [];
    }
  
    function isCustomField(value: unknown): value is CustomField {
      return (
        typeof value === 'object' &&
        value !== null &&
        'field' in value &&
        typeof (value as any).field?.name === 'string' &&
        'value' in value
      );
    }
  
    function formatDate(value: unknown): string {
      if (typeof value === 'string' || value instanceof Date) {
        return new Date(value).toLocaleString();
      }
      return '';
    }
  </script>
  
  <div class="item-view">
    {#if Object.keys(item).length > 0}
      <h1>{item.name}</h1>
      <ul>
        {#each Object.entries(item) as [key, value]}
          {#if key === '__v' || key === '_id'}
            <!-- Skip these fields -->
          {:else if key === 'customFields'}
            {#if getCustomFields(value).length > 0}
              <li>
                <strong>Custom Fields:</strong>
                <ul>
                  {#each getCustomFields(value) as customField}
                    <li>
                      {customField.field.name}: {displayValue(customField.value)}
                    </li>
                  {/each}
                </ul>
              </li>
            {:else}
              <li>No custom fields.</li>
            {/if}
            {:else if key === 'containedItems'}
            <li>
              <strong>Contained Items:</strong>
              {#if Array.isArray(value) && value.length > 0}
                <ul>
                  {#each value as containedItem}
                    <li>{displayValue(containedItem)}</li>
                  {/each}
                </ul>
              {:else}
                <span>No contained items.</span>
              {/if}
            </li>
          {:else if key === 'parentItem'}
          <li>
            <strong>Parent Item:</strong>
            {typeof value === 'object' && value !== null && 'name' in value
              ? value.name
              : 'No parent'}
          </li>
          {:else if key === 'tags'}
            <li>
              <strong>Tags:</strong> 
              {#if Array.isArray(value) && value.length > 0}
                {value.join(', ')}
              {:else}
                <span>No tags.</span>
              {/if}
            </li>
          {:else if key === 'createdAt' || key === 'updatedAt'}
            <li>
              <strong>{key === 'createdAt' ? 'Created At:' : 'Updated At:'}</strong> {formatDate(value)}
            </li>
          {:else}
            <li>
              <strong>{key}:</strong> {displayValue(value)}
            </li>
          {/if}
        {/each}
      </ul>
    {:else}
      <p>Loading item data...</p>
    {/if}
  </div>
  
  <style>
    .item-view ul {
      list-style-type: none;
      padding-left: 0;
    }
    .item-view {
      color: black;
    }
  </style>