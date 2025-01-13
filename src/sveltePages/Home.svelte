<script lang="ts">
  import ItemContainer from "../svelteComponents/ItemContainer.svelte";
  import CreateItem from "../svelteComponents/CreateItem.svelte";
  import type { IBasicItemPopulated } from "../models/basicItem";
  import { ip } from "../stores/ipStore";
  import TopBar from "../svelteComponents/TopBar.svelte";

  import "../svelteStyles/main.css";

  export let searchQuery = "";
  let searchResults: IBasicItemPopulated[] = [];
  export let dialog: HTMLDialogElement;

  async function handleSearch(query: string) {
    searchQuery = query;
    try {
      const response = await fetch(
        `http://${$ip}/api/items/search?name=${encodeURIComponent(searchQuery)}`,
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
</script>

<TopBar {searchQuery} onSearch={handleSearch}></TopBar>

<div class="body">
  {#if searchResults.length > 0}
    <ItemContainer items={searchResults} />
  {:else if searchQuery !== ""}
    <div class="page-component">
      <p>No items found for "{searchQuery}".</p>
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
