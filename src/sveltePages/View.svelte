<!-- Icons from: 
 Font Awesome Free 6.7.2 by @fontawesome 
 - https://fontawesome.com License 
 - https://fontawesome.com/license/free 
 Copyright 2025 Fonticons, Inc.-->

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
    deleteDialog?.close();
    console.log(`Item ${params.id} deleted.`);
    // go to the home page after successful deletion
    navigate("/");
  }

  function onSearch(query: string) {}

  //Track additional item windows
  interface ItemWindow {
    id: string;
    x: number;
    y: number;
  }

  let additionalWindows: ItemWindow[] = [];

  function handleOpenItem(event: CustomEvent) {
    console.log("Opening item in new window:", event.detail);
    const { id } = event.detail;

    //Dont open a new window if the item is already the main item
    if (id === params.id) {
      console.log(
        "Item is already displayed as main view, not opening new window",
      );
      return;
    }

    //Check if the window for this item already exists
    const existingWindow = additionalWindows.find((w) => w.id === id);
    if (existingWindow) {
      return;
    }

    const offsetX = 50 + additionalWindows.length * 30;
    const offsetY = 50 + additionalWindows.length * 30;

    additionalWindows = [...additionalWindows, { id, x: offsetX, y: offsetY }];
  }

  function handleCloseWindow(id: string) {
    additionalWindows = additionalWindows.filter((w) => w.id !== id);
  }

  function openInNewTab(itemId: string) {
    window.open(`/view/${itemId}`, "_blank");
  }
</script>

<!-- Action display above everything -->
<ActionDisplay />

<!-- Top bar and menu -->
<TopBar searchQuery={""} {onSearch} {menu} />
<Menu bind:menu />

{#if item}
  <div class="view-layout page-with-topbar">
    <Window
      initialX={32}
      initialY={32}
      windowTitle="Item Details"
      windowClass="page-component"
      showClose={false}
      showOpenInNewTab={false}
    >
      <ItemDetails {item} on:openItem={handleOpenItem} />

      <div class="button-row-flex">
        <!--Move button-->
        <button
          class="border-button center-button-icons flex-grow font-semibold shadow"
          on:click={() => moveDialog?.showModal()}
        >
          <svg
            class="icon-small"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            ><path
              fill="#ffffff"
              d="M512 160c0 35.3-28.7 64-64 64l-168 0 0 64 46.1 0c21.4 0 32.1 25.9 17 41L273 399c-9.4 9.4-24.6 9.4-33.9 0L169 329c-15.1-15.1-4.4-41 17-41l46.1 0 0-64L64 224c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 64zM448 416l0-64-82.7 0 .4-.4c18.4-18.4 20.4-43.7 11-63.6l71.3 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l71.3 0c-9.4 19.9-7.4 45.2 11 63.6l.4 .4L64 352l0 64 146.7 0 5.7 5.7c21.9 21.9 57.3 21.9 79.2 0l5.7-5.7L448 416z"
            /></svg
          >
        </button>
        <!--Return to home button-->
        <button
          class="border-button center-button-icons flex-grow font-semibold shadow"
          on:click={() => returnDialog?.showModal()}
        >
          <svg
            class="icon-small"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            ><path
              fill="#ffffff"
              d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"
            /></svg
          >
        </button>
        <!--Edit button-->
        <button
          class="border-button center-button-icons flex-grow font-semibold shadow"
          on:click={() => editDialog?.showModal()}
        >
          <svg
            class="icon-small"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            ><path
              fill="#ffffff"
              d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"
            /></svg
          >
        </button>
        <!--Delete button-->
        <button
          class="warn-button center-button-icons flex-grow font-semibold shadow"
          on:click={() => deleteDialog?.showModal()}
        >
          <svg
            class="icon-small"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            ><path
              fill="#ffffff"
              d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
            /></svg
          >
        </button>

        <!-- Add Show Item Tree button when tree is hidden -->
        {#if !showItemTree}
          <button
            class="border-button center-button-icons flex-grow font-semibold shadow"
            on:click={() => (showItemTree = true)}
          >
            <svg
              class="icon-small"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              ><path
                fill="#ffffff"
                d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32l0 96L0 384c0 35.3 28.7 64 64 64l192 0 0-64L64 384l0-224 192 0 0-64L64 96l0-64zM288 192c0 17.7 14.3 32 32 32l224 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32l-98.7 0c-8.5 0-16.6-3.4-22.6-9.4L409.4 9.4c-6-6-14.1-9.4-22.6-9.4L320 0c-17.7 0-32 14.3-32 32l0 160zm0 288c0 17.7 14.3 32 32 32l224 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32l-98.7 0c-8.5 0-16.6-3.4-22.6-9.4l-13.3-13.3c-6-6-14.1-9.4-22.6-9.4L320 288c-17.7 0-32 14.3-32 32l0 160z"
              /></svg
            >
          </button>
        {/if}
      </div>
    </Window>

    <!-- Item Tree Window, has X button -->
    {#if showItemTree && item}
      <Window
        initialX={400 + 32}
        initialY={16}
        windowTitle="Item Tree"
        windowClass="page-component"
        showClose={true}
        showOpenInNewTab={false}
        on:close={handleTreeClose}
      >
        <ItemTree
          parentId={item._id.toString()}
          currentId={item._id.toString()}
          useWindowView={true}
          on:openItem={handleOpenItem}
        />
      </Window>
    {/if}

    <!-- Additional item windows, both buttons -->
    {#each additionalWindows as window (window.id)}
      <Window
        initialX={window.x}
        initialY={window.y}
        windowTitle={`Item View`}
        windowClass="page-component"
        showClose={true}
        showOpenInNewTab={true}
        on:close={() => handleCloseWindow(window.id)}
        on:openNewTab={() => openInNewTab(window.id)}
      >
        <ItemDetails
          item={null}
          itemId={window.id}
          on:openItem={handleOpenItem}
        />
      </Window>
    {/each}
  </div>
{:else}
  <p>Loading item data...</p>
{/if}

<!-- Create Delete Dialog -->
<Dialog
  bind:dialog={deleteDialog}
  on:close={() => {
    deleteDialog?.close();
  }}
>
  <div class="simple-dialog-spacing">
    Are you sure you want to delete {item?.name}?
  </div>
  <DeleteItem itemId={params.id} onDelete={handleDelete}>Delete</DeleteItem>
</Dialog>

<!-- Create Return Dialog -->
<Dialog
  bind:dialog={returnDialog}
  on:close={() => {
    returnDialog?.close();
  }}
>
  <div class="simple-dialog-spacing">
    Are you sure you want to return {item?.name} to its home location?
  </div>
  <ReturnItem itemId={params.id} parentId={item?.homeItem?._id}>
    Return to home
  </ReturnItem>
</Dialog>

<!-- Edit Dialog -->
{#if item}
  <Dialog
    bind:dialog={editDialog}
    on:close={() => {
      editDialog?.close();
    }}
  >
    <EditItem
      {item}
      on:close={() => {
        editDialog?.close();
        location.reload();
      }}
    />
  </Dialog>
{/if}

<Dialog
  bind:dialog={moveDialog}
  on:close={() => {
    moveDialog?.close();
  }}
>
  <div class="important-text text-center">
    Move "{item?.name}" to:
  </div>
  <MoveItem
    itemId={params.id}
    on:close={() => {
      moveDialog?.close();
      location.reload();
    }}
  />
</Dialog>

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
    {item}
    duplicate={false}
    on:close={() => createDialog?.close()}
  />
{/key}
