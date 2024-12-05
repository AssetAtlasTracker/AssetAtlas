<script lang="ts">
    import { Link } from 'svelte-routing';
    import type {IBasicItemPopulated} from '../models/basicItem.js';
    export let item: IBasicItemPopulated;
</script>
  
<div class="item-view">
  {#if item}
    <h1>{item.name}</h1>
    <ul>
      {#if item.description}
        <li><strong>Description:</strong> {item.description}</li>
      {/if}

      {#if item.customFields && item.customFields.length > 0}
        <li>
          <strong>Custom Fields:</strong>
          <ul>
            {#each item.customFields as customField}
              <li>
                {customField.field.fieldName}: {customField.value}
              </li>
            {/each}
          </ul>
        </li>
      {/if}

      {#if item.containedItems && item.containedItems.length > 0}
        <li>
          <strong>Contained Items:</strong>
          <ul>
            {#each item.containedItems as containedItem}
              <li>
                <Link to={`/items/${containedItem._id}`}>{containedItem.name}</Link>
              </li>
            {/each}
          </ul>
        </li>
      {/if}

      {#if item.parentItem}
        <li>
          <strong>Parent Item:</strong>
          <Link to={`/items/${item.parentItem._id}`}>{item.parentItem.name}</Link>
        </li>
      {:else}
        <li><strong>Parent Item:</strong> No parent</li>
      {/if}

      {#if item.tags && item.tags.length > 0}
        <li><strong>Tags:</strong> {item.tags.join(', ')}</li>
      {/if}

      <li><strong>Created At:</strong> {new Date(item.createdAt).toLocaleString()}</li>
      <li><strong>Updated At:</strong> {new Date(item.updatedAt).toLocaleString()}</li>
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