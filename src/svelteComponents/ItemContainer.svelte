<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem";

  export let items: IBasicItemPopulated[];

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);
</script>

{#if items && items.length > 0}
  <div class="glass page-component">
    {#each items as item}
      <Link to={`/view/${item._id}`}>
        <div class="item-card">
          <div class="item-subcard">
            <div class="important-text">
              {item.name}
            </div>
            <div class="sub-text">
              {item.description || "No Description"}
            </div>
          </div>
          <div class="sub-text item-subcard">
            Location: {item.parentItem?.name || "None"}
          </div>
        </div>
      </Link>
      <br />
    {/each}
  </div>
{:else}
  <p>No items found.</p>
{/if}
