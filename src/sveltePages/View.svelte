<script lang="ts">
  import ItemDetails from "../svelteComponents/ItemDetails.svelte";
  import DeleteItem from "../svelteComponents/DeleteItem.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";
  import { navigate } from "svelte-routing";
  import Menu from "../svelteComponents/Menu.svelte";
  import ItemTree from "../svelteComponents/ItemTree.svelte";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import "../svelteStyles/main.css";
  import ReturnItem from "../svelteComponents/ReturnItem.svelte";
  import ActionDisplay from "../svelteComponents/ActionDisplay.svelte";
  import CreateItem from "../svelteComponents/CreateItem.svelte";
  import EditItem from "../svelteComponents/EditItem.svelte";
  import MoveItem from "../svelteComponents/MoveItem.svelte";
  import Window from "../svelteComponents/Window.svelte";
  export let params: { id?: string };

  let showDeleteDialog = false;
  let showReturnDialog = false;
  let showEditDialog = false;
  let showMoveDialog = false;
  let editDialog: HTMLDialogElement | undefined;
  let deleteDialog: HTMLDialogElement | undefined;
  let createDialog: HTMLDialogElement;
  let returnDialog: HTMLDialogElement | undefined;
  let item: IBasicItemPopulated | null = null;
  let dialog: HTMLDialogElement | undefined;
  let moveDialog: HTMLDialogElement | undefined;
  let menu: HTMLDialogElement | undefined;

  let unique = {};
  function restart() {
    unique = {};
  }

  let showItemTree = true;
  
  function handleTreeClose() {
    console.log("Close tree window clicked");
    showItemTree = false;
  }
  
  $: if (params.id) {
    fetchItem(params.id);
    showItemTree = true;
  }

  $: if (showDeleteDialog && deleteDialog) {
    deleteDialog.showModal();
  }
  $: if (showReturnDialog && returnDialog) {
    returnDialog.showModal();
  }
  $: if (showEditDialog && editDialog) {
    editDialog.showModal();
  }
  $: if (showMoveDialog && moveDialog) {
    moveDialog.showModal();
  }

  async function fetchItem(id: string) {
    try {
      console.log("Fetching item from:", `/api/items/${id}`);
      const response = await fetch(`/api/items/${id}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch item: ${response.status} ${response.statusText}`,
        );
      }
      const data: IBasicItemPopulated = await response.json();
      item = data;
      console.log("Fetched item data:", item);
      restart();
    } catch (err) {
      console.error("Error fetching item:", err);
      item = null;
    }
  }

  function handleDelete() {
    showDeleteDialog = false;
    console.log(`Item ${params.id} deleted.`);
    // go to the home page after successful deletion
    navigate("/");
  }

  function onSearch(query: string) {}
</script>

<!-- Action display above everything -->
<ActionDisplay />

<!-- Top bar and menu -->
<TopBar searchQuery={""} {onSearch} {menu} />
<Menu bind:menu />

{#if item}
  <div class="view-layout page-with-topbar">
    <!-- Item Details Window -->
    <Window initialX={32} initialY={32} windowTitle="Item Details" windowClass="page-component">
      <ItemDetails {item} />

      <div class="button-row-flex">
        <button
          class="border-button"
          on:click={() => (showMoveDialog = true)}
        >
          Move
        </button>
        <button
          class="border-button"
          on:click={() => (showReturnDialog = true)}
        >
          Return to Home Location
        </button>
        <button
          class="border-button"
          on:click={() => (showEditDialog = true)}
        >
          Edit
        </button>
        <button
          class="warn-button"
          on:click={() => (showDeleteDialog = true)}
        >
          Delete
        </button>
        
        <!-- Add Show Item Tree button when tree is hidden -->
        {#if !showItemTree}
          <button
            class="border-button highlight-button"
            on:click={() => (showItemTree = true)}
          >
            Show Item Tree
          </button>
        {/if}
      </div>
    </Window>

    {#if showItemTree}
      <Window 
        initialX={400 + 32} 
        initialY={16} 
        windowTitle="Item Tree" 
        windowClass="page-component"
        showClose={true}
        showOpenInNewTab={true}
        on:close={handleTreeClose}
      >
        <ItemTree
          parentId={item._id.toString()}
          currentId={item._id.toString()}
        />
      </Window>
    {/if}
  </div>
{:else}
  <p>Loading item data...</p>
{/if}

<!-- Create Delete Dialog -->
{#if showDeleteDialog}
  <Dialog
    bind:dialog={deleteDialog}
    on:close={() => {
      showDeleteDialog = false;
    }}
  >
    <div class="simple-dialog-spacing">
      Are you sure you want to delete {item?.name}?
    </div>
    <DeleteItem itemId={params.id} onDelete={handleDelete}>Delete</DeleteItem>
  </Dialog>
{/if}

<!-- Create Return Dialog -->
{#if showReturnDialog}
  <Dialog
    bind:dialog={returnDialog}
    on:close={() => {
      showReturnDialog = false;
    }}
  >
    <div class="simple-dialog-spacing">
      Are you sure you want to return {item?.name} to its home location?
    </div>
    <ReturnItem itemId={params.id} parentId={item?.homeItem?._id}>
      Return to home
    </ReturnItem>
  </Dialog>
{/if}

<!-- Edit Dialog -->
{#if showEditDialog && item}
  <Dialog
    bind:dialog={editDialog}
    on:close={() => {
      showEditDialog = false;
    }}
  >
    <EditItem
      {item}
      on:close={() => {
        showEditDialog = false;
        location.reload();
      }}
    />
  </Dialog>
{/if}

{#if showMoveDialog}
  <Dialog
    bind:dialog={moveDialog}
    on:close={() => {
      showMoveDialog = false;
    }}
  >
    <div class="simple-dialog-spacing">
      Move {item?.name} to:
    </div>
    <MoveItem
      itemId={params.id}
      on:close={() => {
        showMoveDialog = false;
        location.reload();
      }}
    />
  </Dialog>
{/if}

<!-- Create Item Dialog -->
<button
  class="add-button text-icon font-bold shadow"
  on:click={() => createDialog?.showModal()}
>
  +
</button>

{#key unique}
  <CreateItem
    bind:dialog={createDialog}
    curLocation={item}
    on:close={() => createDialog?.close()}
  />
{/key}

<style>
  .highlight-button {
    background-color: rgba(0, 100, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 100, 255, 0.4);
  }
  
  .highlight-button:hover {
    background-color: rgba(0, 100, 255, 0.3);
    color: rgb(255, 255, 255);
  }
</style>
