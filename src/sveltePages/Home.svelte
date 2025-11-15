<script lang="ts">
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import { onDestroy, onMount } from "svelte";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import { topBarHeight } from "../stores/topBarStore.js";
  import CreateItem from "../svelteComponents/CreateItem.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";
  import ItemContainer from "../svelteComponents/ItemContainer.svelte";
  import ItemDetails from "../svelteComponents/ItemDetails.svelte";
  import ItemTree from "../svelteComponents/ItemTree.svelte";
  import Menu from "../svelteComponents/Menu.svelte";
  import MoveItem from "../svelteComponents/MoveItem.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import Window from "../svelteComponents/Window.svelte";
  import {login, getEditOnLogin} from '../stores/loginStore.js';
  import type { LoginState } from "../stores/loginStore.js";

  import "../svelteStyles/main.css";

  export let searchQuery = "";
  export let dialog: HTMLDialogElement;
  export let menu: HTMLDialogElement;

  let searchResults: IBasicItemPopulated[] = [];
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

  let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

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
  interface ItemWindow {
    id: string;
    x: number;
    y: number;
  }

  let additionalItemWindows: ItemWindow[] = [];

  function handleOpenItem(event: CustomEvent) {
    const { id } = event.detail;

    const existingWindow = additionalItemWindows.find((w) => w.id === id);
    if (existingWindow) {
      return;
    }

    const offsetX = 50 + additionalItemWindows.length * 30;
    const offsetY = 50 + additionalItemWindows.length * 30;

    additionalItemWindows = [
      ...additionalItemWindows,
      { id, x: offsetX, y: offsetY },
    ];
  }

  function handleCloseWindow(id: string) {
    additionalItemWindows = additionalItemWindows.filter((w) => w.id !== id);
  }

  function openInNewTab(itemId: string) {
    window.open(`/view/${itemId}`, "_blank");
  }

  let currentTopBarHeight: number = 0;

  let unsubscribe: () => void = () => {};

  onMount(() => {
    document.title = "Home - AssetAtlas";
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

<TopBar
  {searchQuery}
  onSearch={handleSearch}
  {menu}
  bind:exactSearch
  on:change={() => handleSearch(searchQuery)}></TopBar>

<div class="view-layout page-with-topbar">
  <Menu bind:menu />

  <div class="sort-flex">
    <div class="simple-flex items-center">
      {#if viewMode === "list"}
        <div class="sort-container custom-dropdown">
          <label for="sort"></label>
          <select
            id="sort"
            bind:value={sortOption}
            on:change={handleSortChange}>
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
        on:change={() => toggleView()}>Tree View</SlideToggle>
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
        bind:targetItemName />
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
      on:close={handleTreeClose}>
      <ItemTree
        bind:draggingItem
        bind:targetItemId
        bind:targetItemName
        bind:showMoveDialog
        useWindowView={true}
        on:openItem={handleOpenItem} />
    </Window>
  {/if}

  {#each additionalItemWindows as window (window.id)}
    <Window
      initialX={window.x}
      initialY={window.y}
      windowTitle={`Item View`}
      windowClass="page-component"
      showClose={true}
      showOpenInNewTab={true}
      on:close={() => handleCloseWindow(window.id)}
      on:openNewTab={() => openInNewTab(window.id)}>
      <ItemDetails
        item={null}
        itemId={window.id}
        on:openItem={handleOpenItem} />
    </Window>
  {/each}

  {#if !getEditOnLogin() || currentLogin?.isLoggedIn}
    <button
      class="add-button text-icon font-bold shadow"
      on:click={() => {
        topLevel = false;
        if (dialog) dialog.showModal();
      }}>
      +
    </button>
  {/if}
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
    on:itemCreated={() => handleSearch(searchQuery)} />
</div>

{#if draggingItem}
  <Dialog
    bind:dialog={moveDialog}
    on:create={() => {
      moveDialog.showModal();
    }}
    on:close={() => {
      showMoveDialog = false;
    }}>
    <div class="important-text text-center">
      Move "{draggingItem.name}" to:
    </div>
    <MoveItem
      itemId={draggingItem._id.toString()}
      parentItemName={targetItemName}
      parentItemId={targetItemId}
      items={undefined}
      on:close={() => {
        showMoveDialog = false;
      }} />
  </Dialog>
{/if}
