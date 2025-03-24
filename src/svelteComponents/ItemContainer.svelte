<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import MdArrowDropDown from 'svelte-icons/md/MdArrowDropDown.svelte'
    import Dialog from "./Dialog.svelte";
    import EditItem from "./EditItem.svelte";
    import CreateItem from "./CreateItem.svelte";
    import { waitForDebugger } from "inspector";
    import Duplicate from "./Duplicate.svelte";

  export let items: IBasicItemPopulated[];
  let createDialog: HTMLDialogElement;
  let duplicateDialog: HTMLDialogElement;
  let creator: CreateItem;
  let duplicator: Duplicate;

  let selectedItem: IBasicItemPopulated | null = null;

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);


  let unique = {};

  let isDropdownOpen = false;

  const handleDropdownClick = () => {
    isDropdownOpen = !isDropdownOpen;
  }
  let i = 0;
</script>

{#if items && items.length > 0}
  <div id="home-component" class="glass page-component">
    {#each items as item}
    <div class="simple-flex">
      <Link to={`/view/${item._id}`} class="item-card">
        <!-- make this border transparent? -->
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
      </Link>
      <div class="flex-1 min-w-[200px] relative">
        <button on:click={() => {handleDropdownClick()}}>
          <div class="dropdown-arrow">
            <MdArrowDropDown/>
          </div>
        </button>
        <ul class="suggestions suggestion-box" style:visibility={isDropdownOpen ? 'visible' : 'hidden'}>
          <button class="suggestion-item" type="button" on:click={() => {duplicator.changeItem(item); duplicateDialog.showModal()}}>Duplicate</button>
          <button class="suggestion-item" type="button" on:click={() => {creator.changeItem(item); createDialog.showModal()}}>Duplicate and Edit</button>
        </ul>
      </div>
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

{#key unique}
  <Duplicate
    bind:dialog={duplicateDialog}
    bind:this={duplicator}
    item={items[0]}
    on:close={() => duplicateDialog?.close()}
  />
{/key}