<script lang="ts">
    import { Link } from 'svelte-routing';
    export let item: Record<string, unknown>; // Define a specific type for `item` if possible
  
    function displayValue(value: unknown): string {
      if (Array.isArray(value)) {
        return value.map((v) => displayValue(v)).join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2); // Pretty-print JSON
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
            <!-- Similar handling for containedItems -->
          {:else if key === 'parentItem'}
            <!-- Similar handling for parentItem -->
          {:else if key === 'tags'}
            <!-- Handle tags -->
          {:else if key === 'createdAt' || key === 'updatedAt'}
            <!-- Handle dates -->
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
  </style>