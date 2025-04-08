<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import MdArrowDropDown from 'svelte-icons/md/MdArrowDropDown.svelte'
    import CreateItem from "./CreateItem.svelte";
    import Duplicate from "./Duplicate.svelte";
    import Dropdown from "./Dropdown.svelte";

  export let items: IBasicItemPopulated[];
  let createDialog: HTMLDialogElement;
  let duplicateDialog: HTMLDialogElement;
  let dropdownDialog: HTMLDialogElement;
  let creator: CreateItem;
  let duplicator: Duplicate;
  let dropdown: Dropdown;

  export let draggingItem: IBasicItemPopulated | null = null;
  export let targetItemId: string | null = null;
  export let targetItemName: string | null = null;
  export let showMoveDialog : boolean;

  let selectedItem: IBasicItemPopulated | null = null;

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);


  let unique = {};

  let isDropdownOpen = false;

 function setFunctions (item: IBasicItemPopulated) {
  dropdown.setDuplicateFunction(() => {duplicator.changeItem(item); dropdownDialog.close(); duplicateDialog.showModal();});
  dropdown.setDuplicateEditFunction(() => {creator.changeItem(item); dropdownDialog.close(); createDialog.showModal()});
 }


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
    {#each items as item}
    <div class="simple-flex" role="navigation" draggable="true"
      on:dragstart={(e) => {handleDragStart(e, item)}}
      on:dragover={(e) => {e.preventDefault()}}
      on:dragend={(e) => {
        e.preventDefault();
        console.log("End Drag");
      }}
      on:drop={handleDragDrop}
      data-item-id={item._id}
      data-item-name={item.name}
    >
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
        <button on:click={() => {dropdownDialog.showModal(); setFunctions(item)}}>
          <div class="dropdown-arrow">
            <MdArrowDropDown/>
          </div>
        </button>
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

{#key unique}
  <Dropdown
    bind:dialog={dropdownDialog}
    bind:this={dropdown}
    item={items[0]}
    on:close={() => dropdownDialog?.close()}
  />
{/key}

