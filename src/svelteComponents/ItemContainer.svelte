<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import MdArrowDropDown from 'svelte-icons/md/MdArrowDropDown.svelte'
    import Dialog from "./Dialog.svelte";
    import EditItem from "./EditItem.svelte";
    import CreateItem from "./CreateItem.svelte";
    import { waitForDebugger } from "inspector";

  export let items: IBasicItemPopulated[];
  let showCreateDialog = false;
  let createDialog: HTMLDialogElement;
  let creator;

  let selectedItem: IBasicItemPopulated | null = null;

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);


  let unique = {};
  function restart() {
    unique = {};
  }
</script>

{#if items && items.length > 0}
  <div id="home-component" class="glass page-component">
    {#each items as item}
    <div class="item-card">
      <Link to={`/view/${item._id}`}>
        <!-- make this border transparent? -->
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
      <button on:click={()=> {creator.changeItem(item); createDialog.showModal()}}>
        <div class="dropdown">
          <MdArrowDropDown/>
        </div>
      </button>
    </div>
      <br />
    {/each}
  </div>
{:else}
  <p>No items found.</p>
{/if}

{#key unique}
  <CreateItem
    bind:dialog={createDialog}
    bind:this={creator}
    item={selectedItem}
    duplicate={true}
    on:close={() => createDialog?.close()}
  />
{/key}