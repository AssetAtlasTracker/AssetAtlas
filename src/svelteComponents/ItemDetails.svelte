<script lang="ts">
  import { Link } from 'svelte-routing';
  import { ip } from '../stores/ipStore';
  import { onMount } from 'svelte';
  import type {IBasicItemPopulated} from '../models/basicItem.js';

  export let item: IBasicItemPopulated;
  let parentChain: { _id: string; name: string }[] = [];

  async function loadParentChain() {
    parentChain = [];
    try {
      const response = await fetch(`http://${$ip}/api/items/parentChain/${item._id}`);
      if (response.ok) {
        parentChain = await response.json();
      } else {
        console.error('Failed to fetch parent chain:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching parent chain:', error);
    }
  }

  onMount(loadParentChain);
  $: if (item._id) {
    loadParentChain();
  }
</script>

<div class="item-view">

  <div class="item-chain">
    {#if parentChain.length > 0}
      <span>Item Chain: </span>
      {#each parentChain as parent, index}
        {#if index < parentChain.length - 1}
          <!-- Render clickable links for all but the last item -->
          <span>
            <Link to={`/view/${parent._id}`}>{parent.name}</Link> >
          </span>
        {:else}
          <!-- Render the last item as bold and non-clickable -->
          <span class="current-item">{parent.name}</span>
        {/if}
      {/each}
    {:else}
      <p>Loading item chain...</p>
    {/if}
  </div>

{#if item}
  <h1>{item.name}</h1>
  <ul>
    {#if item.description}
      <li><strong>Description:</strong> {item.description}</li>
    {/if}

    {#if item.tags && item.tags.length > 0}
      <li><strong>Tags:</strong> {item.tags.join(', ')}</li>
    {/if}

    {#if item.parentItem}
      <li>
        <strong>Parent Item:</strong>
        <Link to={`/view/${item.parentItem._id}`}>{item.parentItem.name}</Link>
      </li>
    {:else}
      <li><strong>Parent Item:</strong> No parent</li>
    {/if}

    {#if item.homeItem}
      <li>
        <strong>Home Item:</strong>
        <Link to={`/view/${item.homeItem._id}`}>{item.homeItem.name}</Link>
      </li>
    {:else}
      <li><strong>Home Item:</strong> No home ;(</li>
    {/if}

    {#if item.containedItems && item.containedItems.length > 0}
      <li>
        <strong>Contained Items:</strong>
        <ul>
          {#each item.containedItems as containedItem}
            <li>
              <Link to={`/view/${containedItem._id}`}>{  containedItem.name}</Link>
            </li>
          {/each}
        </ul>
      </li>
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

    {#if item.itemHistory && item.itemHistory.length > 0}
  <li>
    <strong>History Entries:</strong>
    <ul>
      {#each item.itemHistory as history}
        <li>
          {#if history.location}
            <strong>  Location:</strong>
            <Link to={`/view/${history.location._id}`}>{history.location.name}</Link>
          {:else}
            <strong>  Location:</strong> None
          {/if}
          <strong>Timestamp:</strong> {new Date(history.timestamp).toLocaleString()}
        </li>
      {/each}
    </ul>
  </li>
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
  color: white;
}
.item-chain {
  margin: 1rem 0;
  font-size: 1rem;
  color: #ffffff;
}
.item-chain span {
  white-space: nowrap;
}
</style>