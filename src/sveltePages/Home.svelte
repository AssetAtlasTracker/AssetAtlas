<script lang="ts">
  import ItemContainer from "../svelteComponents/ItemContainer.svelte";
  import CreateItem from "../svelteComponents/CreateItem.svelte";
  import type { IBasicItemPopulated } from "../models/basicItem";
  import { ip } from "../stores/ipStore";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import { onMount } from 'svelte';

  import "../svelteStyles/main.css";

  export let searchQuery = "";
  let searchResults: IBasicItemPopulated[] = [];
  export let dialog: HTMLDialogElement;
  let sortOption: string = "alphabetical";
  let exactSearch = false;

  async function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    sortOption = target.value;
    await handleSearch(searchQuery);
  }

  async function handleSearch(query: string) {
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
      searchResults = data as IBasicItemPopulated[];
    } catch (err) {
      console.error("Error searching items:", err);
    }
  }

  onMount(() => {
    handleSearch("");
  });
</script>

<TopBar {searchQuery} onSearch={handleSearch}></TopBar>

<div class="search-controls">
  <div class="sort-container custom-dropdown">
    <label for="sort">Sort By:</label>
    <select id="sort" bind:value={sortOption} on:change={handleSortChange}>
      <option value="alphabetical">Alphabetical</option>
      <option value="firstAdded">First Added</option>
      <option value="lastAdded">Last Added</option>
    </select>
  </div>

  <label class="exact-search">
    <input type="checkbox" bind:checked={exactSearch} on:change={() => handleSearch(searchQuery)} />
    Exact Search
  </label>
</div>

<div class="body">
  {#if searchResults.length > 0}
    <ItemContainer items={searchResults} />
  {:else}
    <div class="page-component">
      <p>No items found.</p>
    </div>
  {/if}

  <button
    class="add-button text-icon font-bold shadow"
    on:click={() => dialog.showModal()}
  >
    +
  </button>
  <CreateItem bind:dialog />
</div>

<style>
  .search-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem;
  }

  .sort-container {
    min-width: 200px;
  }

  .exact-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  select {
    width: 100%;
    min-width: 200px;
  }
</style>
