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
  export let params: { id?: string };

  let showDeleteDialog = false;
  let showReturnDialog = false;
  let deleteDialog: HTMLDialogElement;
  let createDialog: HTMLDialogElement;
  let returnDialog: HTMLDialogElement;
  let item: IBasicItemPopulated | null = null;
  export let dialog: HTMLDialogElement;
  export let moveDialog: HTMLDialogElement;
  export let menu: HTMLDialogElement;

  let unique = {};
  function restart() {
    unique = {};
  }

  //If item ID changes, fetch that item
  $: if (params.id) {
    fetchItem(params.id);
  }

  $: if (showDeleteDialog && deleteDialog) {
    deleteDialog.showModal();
  }
  $: if (showReturnDialog && returnDialog) {
    returnDialog.showModal();
  }

  async function fetchItem(id: string) {
    try {
      console.log("Fetching item from:", `/api/items/${id}`);
      const response = await fetch(`/api/items/${id}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch item: ${response.status} ${response.statusText}`
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

  function onSearch(query: string) {
  }

  let detailsContainer: HTMLElement;
  let treeContainer: HTMLElement;
  let activeContainer: HTMLElement | null = null;
  let startX = 0;
  let startY = 0;

  function handleMouseDown(event: MouseEvent, container: HTMLElement) {
    //Disable text-selection while dragging
    document.body.style.userSelect = "none";
    activeContainer = container;

    const style = window.getComputedStyle(container);
    const matrix = new DOMMatrixReadOnly(style.transform);

    const currentX = matrix.m41;
    const currentY = matrix.m42;

    startX = event.clientX - currentX;
    startY = event.clientY - currentY;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!activeContainer) return;

    const newX = event.clientX - startX;
    const newY = event.clientY - startY;

    activeContainer.style.transform = `translate(${newX}px, ${newY}px)`;
  }

  function handleMouseUp() {
    //Re-enable text selection
    document.body.style.userSelect = "";
    activeContainer = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }
</script>

<!-- Action display above everything -->
<ActionDisplay />

<!-- Top bar and menu -->
<TopBar searchQuery={""} onSearch={onSearch} {menu} />
<Menu bind:menu />

{#if item}
  <div class="view-layout">
    <!-- Item Details Window -->
    <div
      bind:this={detailsContainer}
      class="floating-container glass page-component"
      style="transform: translate(2rem, 2rem);" 
    >
      <div
        class="window-bar"
        role="button"
        tabindex="0"
        on:mousedown={(e) => handleMouseDown(e, detailsContainer)}
        aria-label="Drag to move item details"
      ></div>

      <div class="window-content">
        <ItemDetails {item} />

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
      </div>
    </div>

    <!-- Item Tree Window -->
    <div
      bind:this={treeContainer}
      class="floating-container glass page-component"
      style="transform: translate(calc(400px + 2rem), 1rem);" 
    >
      <div
        class="window-bar"
        role="button"
        tabindex="0"
        on:mousedown={(e) => handleMouseDown(e, treeContainer)}
        aria-label="Drag to move item tree"
      ></div>

      <div class="window-content">
        <ItemTree parentId={item._id.toString()} currentId={item._id.toString()} />
      </div>
    </div>
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
    <DeleteItem itemId={params.id} onDelete={handleDelete}>
      Delete
    </DeleteItem>
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

<!-- Create Item Dialog -->
<button
  class="add-button text-icon font-bold shadow"
  on:click={() => createDialog.showModal()}
>
  +
</button>

{#key unique}
  <CreateItem bind:dialog={createDialog} curLocation={item} />
{/key}

