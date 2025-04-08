<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import ItemCardOptions from "./ItemCardOptions.svelte";

  export let items: IBasicItemPopulated[];

  let itemCardOptions: ItemCardOptions;

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);
</script>

{#if items && items.length > 0}
  <div id="home-component" class="glass page-component">
    {#each items as i}
      <div class="item-card-flex">
        <Link to={`/view/${i._id}`} class="item-card">
          <!-- make this border transparent? -->
          <div class="item-subcard">
            <div class="important-text">
              {i.name}
            </div>
            <div class="sub-text">
              {i.description || "No Description"}
            </div>
          </div>
          <div class="sub-text item-subcard">
            Location: {i.parentItem?.name || "None"}
          </div>
        </Link>
        <ItemCardOptions
          bind:this={itemCardOptions}
          on:mouseenter={() => console.log("mouse entered")}
          item={i}
        />
      </div>
      <br />
    {/each}
  </div>
{:else}
  <p>No items found.</p>
{/if}
