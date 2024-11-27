<script lang="ts">
  export let searchQuery = '';
  export let onSearch: (query: string) => void;

  function handleSearch() {
    onSearch(searchQuery);
  }
</script>

<div class="flex">
  <input
    class="flex-auto searchbar py-2 px-4"
    type="text"
    placeholder="Search items"
    bind:value={searchQuery}
  />
  <button class="nav-margin border-button hover:bg-gray-100 font-semibold py-2 px-4 shadow" on:click={handleSearch}>
    Search
  </button>
</div>