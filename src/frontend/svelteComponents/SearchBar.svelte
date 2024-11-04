<script lang="ts">
  export let searchQuery = '';
  export let onSearch: (query: string) => void;

  function handleSearch() {
    onSearch(searchQuery);
  }
</script>

<div>
  <input
    type="text"
    placeholder="Search items"
    bind:value={searchQuery}
  />
  <button on:click={handleSearch}>Search</button>
</div>

<style>
  input {
    width: 100%;
    padding: 8px;
    margin-right: 10px;
    font-size: 16px;
  }

  button {
    padding: 8px 12px;
    font-size: 16px;
    cursor: pointer;
  }
</style>