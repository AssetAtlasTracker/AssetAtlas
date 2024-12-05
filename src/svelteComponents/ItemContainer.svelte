<script lang="ts">
  import { Link } from 'svelte-routing';
  import type { IBasicItemPopulated } from '../models/basicItem';
  export let items: IBasicItemPopulated[];

  // Log items to verify data in the frontend
  console.log('Items in frontend:', items);
</script>

{#if items && items.length > 0}
  <div class="rounded bg-white page-component">
    {#each items as item}
      <Link to={`/view/${item._id}`}>
        <div class="rounded item-card">
          <div class="item">{item.name}</div>
          <div class="item">
            Location: {item.parentItem?.name || "None"}
          </div>
          <div class="item desc">Description: {item.description}</div>
        </div>
      </Link>
      <br />
    {/each}
  </div>
{:else}
  <p>No items found.</p>
{/if}
  
  <style>
    .page-component{
      margin: 1.5rem;
      padding: 1.5rem;
      box-shadow: 5px 5px 8px -8px slategray
    }
  
    .item-card {
      box-sizing: border-box;
      width: 95%;
      margin: 0 auto;
      padding: 20px;
      background-color: rgb(116, 116, 116);
      box-shadow: 5px 5px 8px -8px slategray
    }

    .item {
      display: inline-block;
      width: 25%;
    }

    .desc {
      width: 40%;
    }
  </style>