<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem";
  export let items: IBasicItemPopulated[];

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);
</script>

{#if items && items.length > 0}
  <div class="rounded item-component">
    {#each items as item}
      <Link to={`/view/${item._id}`}>
        <div class="rounded item-card">
          <div class="item">
            {item.name}
          </div>

          <div class="item">
            Location: {item.parentItem?.name || "None"}
          </div>

          <div class="item desc">
            Description: {item.description}
          </div>
        </div>
      </Link>
      <br />
    {/each}
  </div>
{:else}
  <p>No items found.</p>
{/if}
