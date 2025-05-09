<script lang="ts">
  import { Link } from "svelte-routing";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import ItemCardOptions from "./ItemCardOptions.svelte";
    import { setDefaultAutoSelectFamilyAttemptTimeout } from "net";
    import MultiActions from "./MultiActions.svelte";
    import Dialog from "./Dialog.svelte";
  import { createEventDispatcher } from "svelte";

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
    let checkboxes = document.getElementsByTagName("input");
    for (let i = 0; i < checkboxes.length; i ++){
      checkboxes[i].checked = true;
    }
    selectedItems = items;
    numSelected = items.length;
    console.log(selectedItems);
  }

  function deselectAll() {
    let checkboxes = document.getElementsByTagName("input");
    for (let i = 0; i < checkboxes.length; i ++){
      checkboxes[i].checked = false;
    }
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

  const dispatch = createEventDispatcher();

  function onCreated() {
    dispatch("itemCreated");
  }

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
      draggingItem = item;
    }
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
    {#each items as i (i._id)}
      <div class="item-card-flex" role="navigation" draggable="true"
      on:dragstart={(e) => {handleDragStart(e, i)}}
      on:dragover={(e) => {e.preventDefault()}}
      on:dragend={(e) => {
        e.preventDefault();
      }}
      on:drop={handleDragDrop}
      data-item-id={i._id}
      data-item-name={i.name}
    >
        <input type="checkbox" style="width: 20px; height: 20px; align-self: center; margin: auto 0;" on:click={() => {handleSelect(i)}}>
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
          on:itemCreated={onCreated}
        />
      </div>
      <br />
    {/each}
  </div>
{:else}
  <p>No items found.</p>
{/if}
