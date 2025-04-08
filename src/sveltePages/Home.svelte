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

  import "../svelteStyles/main.css";

  export let searchQuery = "";
  let searchResults: IBasicItemPopulated[] = [];
  export let dialog: HTMLDialogElement;
  let sortOption: string = "alphabetical";
  let exactSearch = false;
  let viewMode: "list" | "tree" = "list";

  let topLevel = true;
  let itemCount = -1;

  let draggingItem : IBasicItemPopulated;
  let targetItemId : string | undefined;
  let targetItemName : string | undefined;
  let showMoveDialog : boolean = false;
  let moveDialog : HTMLDialogElement;

  $: if (showMoveDialog) {
    if (moveDialog) {
      moveDialog.showModal();
    }
  }


  async function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    sortOption = target.value;
    await handleSearch(searchQuery);
  }

  import Menu from "../svelteComponents/Menu.svelte";
  import ActionDisplay from "../svelteComponents/ActionDisplay.svelte";
    import Dialog from "../svelteComponents/Dialog.svelte";
    import MoveItem from "../svelteComponents/MoveItem.svelte";
  export let menu: HTMLDialogElement;

  async function handleSearch(query: string) {
    console.log("Home: Starting search operation");
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
      console.log("Home: Search completed, updating results");
      searchResults = data as IBasicItemPopulated[];
      itemCount = searchResults.length;
    } catch (err) {
      console.error("Home: Error searching items:", err);
    }
  }

  function toggleView(mode: "list" | "tree") {
    viewMode = mode;
    
    //show the tree window when switching to tree view
    if (mode === "tree") {
      showItemTree = true;
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
    console.log("Opening item in new window:", event.detail);
    const { id } = event.detail;
    
    // Check if the window for this item already exists
    const existingWindow = additionalWindows.find(w => w.id === id);
    if (existingWindow) {
      return;
    }
    
    const offsetX = 50 + (additionalWindows.length * 30);
    const offsetY = 50 + (additionalWindows.length * 30);
    
    additionalWindows = [
      ...additionalWindows, 
      { id, x: offsetX, y: offsetY }
    ];
  }
  
  function handleCloseWindow(id: string) {
    additionalWindows = additionalWindows.filter(w => w.id !== id);
  }

  function openInNewTab(itemId: string) {
    window.open(`/view/${itemId}`, '_blank');
  }

  // Keep a reference to currentTopBarHeight
  let currentTopBarHeight: number = 0;
  
  let unsubscribe: () => void = () => {};

  onMount(() => {
    console.log("Home: Component mounted");
    handleSearch("");
    unsubscribe = topBarHeight.subscribe((value) => {
      currentTopBarHeight = value;
    });
  });

  onDestroy(() => {
    unsubscribe();
  });

  let showItemTree = true;
  
  function handleTreeClose() {
    console.log("Close tree window clicked");
    showItemTree = false;
  }
</script>

{#if topLevel}
  <ActionDisplay />
{/if}

<TopBar {searchQuery} onSearch={handleSearch} {menu}></TopBar>

<div class="view-layout page-with-topbar">
  <!-- Menu for navigation - Slides out -->
  <Menu bind:menu />
  <div class="sort-flex">
    <div class="search-controls">
      <div class="sort-container custom-dropdown">
        <label for="sort">Sort By:</label>
        <select id="sort" bind:value={sortOption} on:change={handleSortChange}>
          <option value="alphabetical">A-Z</option>
          <option value="lastAdded">Newest</option>
          <option value="firstAdded">Oldest</option>
        </select>
      </div>
      <!-- This should be next to the search bar-->
      <label class="exact-search">
        <input
          type="checkbox"
          bind:checked={exactSearch}
          on:change={() => handleSearch(searchQuery)}
        />
        Exact Search
      </label>
    </div>

    <!--This should probably be an actual toggle switch-->
    <div class="home-view-buttons">
      <button
        class="border-button font-semibold shadow mt-4 block"
        on:click={() => toggleView("list")}>List View</button
      >
    </div>

    <div class="home-view-buttons">
      <button
        class="border-button font-semibold shadow mt-4 block"
        on:click={() => toggleView("tree")}>Tree View</button
      >
    </div>
    
  </div>

  {#if viewMode === "list"}
    {#if itemCount > 0}
      <ItemContainer items={searchResults} bind:showMoveDialog={showMoveDialog} bind:draggingItem={draggingItem} bind:targetItemId={targetItemId} bind:targetItemName={targetItemName}/>
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
          If loading takes longer than expected, you may need to refresh
          the page.
        </p>
      </div>
    {/if}
  {:else}
    
    {#if showItemTree}
      <Window 
        initialX={32} 
        initialY={64} 
        windowTitle="Item Tree" 
        windowClass="page-component"
        showClose={true}
        showOpenInNewTab={false}
        on:close={handleTreeClose}
      >
        <ItemTree useWindowView={true} on:openItem={handleOpenItem} />
      </Window>
    {/if}
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
    on:open={() => {topLevel = false}} 
    on:close={()=>{topLevel = true}}
  />
</div>

{#if showMoveDialog}
<Dialog
  bind:dialog={moveDialog}
  on:create={() => {
    console.log("Created Modal");
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
