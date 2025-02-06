<script lang="ts">
  import ItemDetails from "../svelteComponents/ItemDetails.svelte";
  import DeleteItem from "../svelteComponents/DeleteItem.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import EditItem from "../svelteComponents/EditItem.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";
  import { navigate } from "svelte-routing";
  import Menu from "../svelteComponents/Menu.svelte";

  import type { IBasicItemPopulated } from "../models/basicItem";

  import "../svelteStyles/main.css";
  import MoveItem from "../svelteComponents/MoveItem.svelte";
  import ReturnItem from "../svelteComponents/ReturnItem.svelte";
    import ActionDisplay from "../svelteComponents/ActionDisplay.svelte";
    import CreateItem from "../svelteComponents/CreateItem.svelte";
  export let params: { id?: string };
  //console.log('View params:', params);

  let showDeleteDialog = false;
  let showMoveDialog = false;
  let showReturnDialog = false;
  let deleteDialog: HTMLDialogElement;
  let createDialog: HTMLDialogElement;
  let returnDialog: HTMLDialogElement;
  let item: IBasicItemPopulated | null = null;
  export let dialog: HTMLDialogElement;
  export let moveDialog: HTMLDialogElement;
  export let menu: HTMLDialogElement;

  let unique = {} 
  

  function restart() {
   unique = {}
  }

  let topLevel = true;

  $: if (params.id) {
    fetchItem(params.id);
  }

  $: if (showDeleteDialog) {
    if (deleteDialog) {
      deleteDialog.showModal();
    }
  }

  $: if (showReturnDialog) {
    if (returnDialog) {
      returnDialog.showModal();
    }
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
    //go to the home page after successful deletion
    navigate("/");
  }

  // async function closeMove() {
  //   showMoveDialog = false;
  //   if (moveDialog) {
  //     moveDialog.close();
  //   }
  //   navigate(`/view/${params.id}`);
  // }

  // function closeEdit() {
  //   if (dialog) {
  //     dialog.close();
  //   }
  // }

  function onSearch (query: string) {}
</script>
<ActionDisplay/>

<TopBar searchQuery={""} onSearch={onSearch} {menu}></TopBar>

<Menu bind:menu />

{#if item}
  <div class="item-view glass page-component">
    <ItemDetails {item} />

    <br />
    <div class="button-row-flex">
      <button class="border-button" on:click={() => moveDialog.showModal()}>
        Move
      </button>
      <button class="border-button" on:click={() => (showReturnDialog = true)}>
        Return to Home Location
      </button>
      <button class="border-button" on:click={() => dialog.showModal()}>
        Edit
      </button>
      <button class="warn-button" on:click={() => (showDeleteDialog = true)}>
        Delete
      </button>
    </div>

    <EditItem {item} bind:dialog />
    <MoveItem itemId={item._id} bind:dialog={moveDialog} />
  </div>
{:else}
  <!--TODO: Polish this up a bit-->
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

    <br />
    <!--Probably going to want an additional cancel button here-->
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
      Are you sure you want to return {item?.name} to it's home location?
    </div>

    <br />
    <!--Probably going to want an additional cancel button here-->
    <ReturnItem itemId={params.id} parentId={item?.homeItem?._id}>
      Return to home
    </ReturnItem>
  </Dialog>
{/if}

<button
    class="add-button text-icon font-bold shadow"
    on:click={() => {
        topLevel = false;
        createDialog.showModal()}
      }
  >
    +
  </button>
  {#key unique}
    <CreateItem bind:dialog={createDialog} curLocation={item}/>
  {/key}