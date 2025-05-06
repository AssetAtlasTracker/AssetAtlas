<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import ItemCardOptions from "./ItemCardOptions.svelte";
    import { setDefaultAutoSelectFamilyAttemptTimeout } from "net";
    import MultiActions from "./MultiActions.svelte";
    import Dialog from "./Dialog.svelte";

  export let items: IBasicItemPopulated[];

  let selectedItems: IBasicItemPopulated[] = [];
  let selected = [];

  let dialog: HTMLDialogElement;
  
  let multiActions: MultiActions;
  let itemCardOptions: ItemCardOptions;
  let numSelected = 0;

  function handleSelect(item: IBasicItemPopulated) {
    if (selectedItems.includes(item)){
      deselectItem(item);
    }
    else {
      selectItem(item);
    }
  }

  function selectItem(item: IBasicItemPopulated){
    selectedItems.push(item);
    numSelected ++;
  }

  function deselectItem(item: IBasicItemPopulated){
    let index = selectedItems.indexOf(item);
    selectedItems.splice(index, 1);
    numSelected --;
  }

  function selectAll(){
    selectedItems = items;
    numSelected = items.length;
    //selected = [...items];
    console.log(selectedItems);
  }

  function deselectAll() {
    selectedItems = [];
    numSelected = 0;
    //selected = [];
    console.log(selectedItems);
  }

  function handleDeleteAll(){
    multiActions.setAction("delete");
    multiActions.setItems(selectedItems);
    dialog.showModal();
  }

  function handleMoveAll(){
    multiActions.setAction("move");
    multiActions.setItems(selectedItems);
    dialog.showModal();
  }

  function handleClose() {
    dialog.close();
    location.reload();
  }

  // Log items to verify data in the frontend
  console.log("Items in frontend:", items);
</script>

{#if items && items.length > 0}
  {#if numSelected > 0}
  <Dialog bind:dialog={dialog} on:close={handleClose}><MultiActions on:close={handleClose} bind:this={multiActions}/></Dialog>
  <div class="sort-flex">
    <button class="success-button font-semibold shadow mt-4 w-full block" on:click={selectAll}>Select All</button>
    <button class="success-button font-semibold shadow mt-4 w-full block" on:click={deselectAll}>Deselect All</button>
    <button class="success-button font-semibold shadow mt-4 w-full block"on:click={handleMoveAll}>Move Selected</button>
    <button class="warn-button font-semibold shadow mt-4 w-full block"on:click={handleDeleteAll}>Delete Selected</button>
  </div>
  {/if}
  <div id="home-component" class="glass page-component">
    {#each items as i}
      <div class="item-card-flex">
        <input type="checkbox" on:click={() => {handleSelect(i)}}>
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
