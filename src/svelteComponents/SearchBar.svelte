<script lang="ts">
  export let searchQuery = '';
  export let onSearch: (query: string) => void;

  function handleSearch() {
    onSearch(searchQuery);
  }
</script>

<div class="flex">
  <input
    class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded"
    type="text"
    placeholder="Search items"
    bind:value={searchQuery}
  />
  <button class="nav-margin border-button hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 shadow" 
          on:click={handleSearch}>Search</button>
</div>