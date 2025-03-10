<script lang="ts">
  import ItemContainer from "../svelteComponents/ItemContainer.svelte";
  import CreateItem from "../svelteComponents/CreateItem.svelte";
  import ItemTree from "../svelteComponents/ItemTree.svelte";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import { ip } from "../stores/ipStore.js";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import { onMount } from "svelte";

  import "../svelteStyles/main.css";

  export let searchQuery = "";
  let searchResults: IBasicItemPopulated[] = [];
  export let dialog: HTMLDialogElement;
  let sortOption: string = "alphabetical";
  let exactSearch = false;
  let viewMode: "list" | "tree" = "list";

  let topLevel = true;
  let itemCount = -1;

  async function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    sortOption = target.value;
    await handleSearch(searchQuery);
  }

  import Menu from "../svelteComponents/Menu.svelte";
    import ActionDisplay from "../svelteComponents/ActionDisplay.svelte";
  export let menu: HTMLDialogElement;

  async function handleSearch(query: string) {
    console.log("Home: Starting search operation");
    searchQuery = query;
    try {
      const response = await fetch(
        `http://${$ip}/api/items/search?` +
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
  }

  onMount(() => {
    console.log("Home: Component mounted");
    handleSearch("");
  });
</script>

{#if topLevel}
  <ActionDisplay/>
{/if}

<TopBar {searchQuery} onSearch={handleSearch} {menu}></TopBar>

<div class="body page-with-topbar">
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
      <ItemContainer items={searchResults} />
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
        <p class="text-center important-text">Loading Items</p>

        <br />
        <div class="placeholder animate-pulse" />
        
      </div>
    {/if}
  {:else}
    <div id="home-component" class="glass page-component">
      <ItemTree />
    </div>
  {/if}

  <button
    class="add-button text-icon font-bold shadow"
    on:click={() => {
        topLevel = false;
        if (dialog) dialog.showModal();
      }
    }
  >
    +
  </button>
  <CreateItem 
    bind:dialog 
    curLocation={null} 
    on:open={() => {topLevel = false}} 
    on:close={()=>{topLevel = true}}
  />
</div>
