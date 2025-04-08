<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import ItemCardOptions from "./ItemCardOptions.svelte";

  export let items: IBasicItemPopulated[];

  let itemCardOptions: ItemCardOptions;

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);

  export let draggingItem: IBasicItemPopulated | null = null;
  export let targetItemId: string | null = null;
  export let targetItemName: string | null = null;
  export let showMoveDialog : boolean;


    function handleDragDrop(event: DragEvent & { currentTarget: EventTarget & HTMLDivElement; }) {
      let foundDataContainingElement = false;
      let currentTarget : HTMLElement | null = event.currentTarget as HTMLElement | null;
      let maxOut = 10;
      while (!foundDataContainingElement) {
        if (currentTarget) {
          if (currentTarget.draggable) {
            foundDataContainingElement = true;
          } else if (maxOut <= 0) {
            return;
          } else {
            currentTarget = currentTarget.parentElement;
            if (currentTarget === null) {
              return;
            }
            maxOut--;
          }
        } else {
          return;
        }
      }
      targetItemId = currentTarget!.getAttribute("data-item-id");
      targetItemName = currentTarget!.getAttribute("data-item-name");
      if (targetItemId && targetItemName && draggingItem) {
        showMoveDialog = true;
        console.log("Successful Drop");
      }
    }

    function handleDragStart(event: DragEvent, item: IBasicItemPopulated) {
      console.log("Drag started");
      draggingItem = item;
    }
</script>

{#if items && items.length > 0}
  <div id="home-component" class="glass page-component">
    {#each items as i}
      <div class="item-card-flex" role="navigation" draggable="true"
      on:dragstart={(e) => {handleDragStart(e, i)}}
      on:dragover={(e) => {e.preventDefault()}}
      on:dragend={(e) => {
        e.preventDefault();
        console.log("End Drag");
      }}
      on:drop={handleDragDrop}
      data-item-id={i._id}
      data-item-name={i.name}
    >
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
