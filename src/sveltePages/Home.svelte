<script lang="ts">
  import ItemContainer from "../svelteComponents/ItemContainer.svelte";
  import CreateItem from "../svelteComponents/CreateItem.svelte";
  import ItemTree from "../svelteComponents/ItemTree.svelte";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import { onMount, onDestroy } from "svelte";
  import Window from "../svelteComponents/Window.svelte";
  import ItemDetails from "../svelteComponents/ItemDetails.svelte";
  import { topBarHeight } from "../stores/topBarStore.js";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import ActionDisplay from "../svelteComponents/ActionDisplay.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";
  import MoveItem from "../svelteComponents/MoveItem.svelte";

  import "../svelteStyles/main.css";

  export let searchQuery = "";
  let searchResults: IBasicItemPopulated[] = [];
  export let dialog: HTMLDialogElement;
  let sortOption: string = "alphabetical";
  let exactSearch = false;
  let viewMode: "list" | "tree" = "list";
  $: showItemTree = viewMode === "tree";

  let topLevel = true;
  let itemCount = -1;

  let draggingItem: IBasicItemPopulated | undefined = undefined;
  let targetItemId: string | undefined = undefined;
  let targetItemName: string | undefined = undefined;
  let showMoveDialog: boolean = false;
  let moveDialog: HTMLDialogElement;

  $: {
    if (showMoveDialog) {
      moveDialog.showModal();
    }
  }

  $: {
    if (moveDialog) {
      moveDialog.onclose = () => {
        showMoveDialog = false;
      };
    }
  }

  async function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    sortOption = target.value;
    await handleSearch(searchQuery);
  }

  import Menu from "../svelteComponents/Menu.svelte";
  export let menu: HTMLDialogElement;

  async function handleSearch(query: string) {
    searchQuery = query;
    try {
      const response = await fetch(
        `/api/items/search?` +
          `name=${encodeURIComponent(searchQuery)}&` +
          `sort=${encodeURIComponent(sortOption)}&` +
          `exact=${exactSearch.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      searchResults = data as IBasicItemPopulated[];
      itemCount = searchResults.length;
    } catch (err) {
      console.error("Home: Error searching items:", err);
    }
  }

  function toggleView() {
    if (viewMode === "list") {
      viewMode = "tree";
    } else {
      viewMode = "list";
    }
    window.localStorage.setItem("viewMode", viewMode);
  }

  function restoreViewMode() {
    const savedViewMode = window.localStorage.getItem("viewMode");
    if (savedViewMode != null) {
      viewMode = savedViewMode === "tree" ? "tree" : "list";
    }
  }

  // Track additional item windows
  interface ItemWindow {
    id: string;
    x: number;
    y: number;
  }

  let additionalWindows: ItemWindow[] = [];

  function handleOpenItem(event: CustomEvent) {
    const { id } = event.detail;

    // Check if the window for this item already exists
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

  let currentTopBarHeight: number = 0;

  let unsubscribe: () => void = () => {};

  onMount(() => {
    document.title = "Home - AssetAtlas"
    handleSearch("");
    restoreViewMode();
    unsubscribe = topBarHeight.subscribe((value) => {
      currentTopBarHeight = value;
    });
  });

  onDestroy(() => {
    unsubscribe();
  });

  function handleTreeClose() {
    toggleView();
  }
</script>

<TopBar {searchQuery} onSearch={handleSearch} {menu}></TopBar>

<div class="view-layout page-with-topbar">
  <!-- Slide out menu (contains import/export, etc.) -->
  <Menu bind:menu />

  <div class="sort-flex">
    <SlideToggle
      name="exactToggle"
      active="toggle-background"
      bind:checked={exactSearch}
      on:change={() => handleSearch(searchQuery)}>Exact Search</SlideToggle
    >

    <div class="simple-flex items-center">
      {#if viewMode === "list"}
        <div class="sort-container custom-dropdown">
          <label for="sort"></label>
          <select
            id="sort"
            bind:value={sortOption}
            on:change={handleSortChange}
          >
            <option value="alphabetical">A-Z</option>
            <option value="lastAdded">Newest</option>
            <option value="firstAdded">Oldest</option>
          </select>
        </div>
      {/if}

      <SlideToggle
        name="treeToggle"
        active="toggle-background"
        bind:checked={showItemTree}
        on:change={() => toggleView()}>Tree View</SlideToggle
      >
    </div>
  </div>

  {#if viewMode === "list"}
    {#if itemCount > 0}
      <ItemContainer
        items={searchResults}
        on:itemCreated={() => handleSearch(searchQuery)}
        bind:showMoveDialog
        bind:draggingItem
        bind:targetItemId
        bind:targetItemName
      />
    {:else if itemCount == 0}
      <div id="home-component" class="page-component glass">
        <p class="text-center important-text">No Items Found</p>
        <br />
        <p class="text-center">
          Add new items using the + button in the bottom right.
        </p>
        <p class="text-center">
          Or import bulk items using the menu in the top left.
        </p>
        <br />
        <p class="text-center">
          If you are expecting items to be here, you may need to refresh the
          page.
        </p>
      </div>
    {:else}
      <div id="home-component" class="page-component glass">
        <p class="text-center important-text">Loading Items...</p>

        <br />
        <div class="placeholder animate-pulse" />
        <br />

        <p class="text-center sub-text">
          If loading takes longer than expected, you may need to refresh the
          page.
        </p>
      </div>
    {/if}
  {:else if showItemTree}
    <Window
      initialX={32}
      initialY={64}
      windowTitle="Item Tree"
      windowClass="page-component"
      showClose={true}
      showOpenInNewTab={false}
      on:close={handleTreeClose}
    >
      <ItemTree
        bind:draggingItem
        bind:targetItemId
        bind:targetItemName
        bind:showMoveDialog
        useWindowView={true}
        on:openItem={handleOpenItem}
      />
    </Window>
  {/if}

  <!-- Additional item windows -->
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

  <button
    class="add-button text-icon font-bold shadow"
    on:click={() => {
      topLevel = false;
      if (dialog) dialog.showModal();
    }}
  >
    +
  </button>
  <CreateItem
    bind:dialog
    item={null}
    duplicate={false}
    on:open={() => {
      topLevel = false;
    }}
    on:close={() => {
      topLevel = true;
    }}
    on:itemCreated={() => handleSearch(searchQuery)}
  />
</div>

{#if draggingItem}
  <Dialog
    bind:dialog={moveDialog}
    on:create={() => {
      moveDialog.showModal();
    }}
    on:close={() => {
      showMoveDialog = false;
    }}
  >
    <div class="important-text text-center">
      Move "{draggingItem.name}" to:
    </div>
    <MoveItem
      itemId={draggingItem._id.toString()}
      parentItemName={targetItemName}
      parentItemId={targetItemId}
      on:close={() => {
        showMoveDialog = false;
      }}
    />
  </Dialog>
{/if}
