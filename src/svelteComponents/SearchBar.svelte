<script lang="ts">
  export let searchQuery: string = '';
  export let onSearch: (query: string) => void;
  export let results: { name: string }[] = [];

  let debounceTimeout: string | number | NodeJS.Timeout | undefined;

  //Debounce the search input to prevent excessive API calls
  $: if (searchQuery !== undefined) {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      onSearch(searchQuery);
    }, 300); //debounce delay
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      searchQuery = target.value;
    }
  }

  function selectSuggestion(suggestion: any) {
    searchQuery = suggestion.name;
    onSearch(searchQuery);
    results = [];
  }
</script>

<div class="flex flex-col relative">
  <input
    class="flex-auto searchbar py-2 px-4"
    type="text"
    placeholder="Search items"
    bind:value={searchQuery}
    on:input={handleInput}
  />

  <!-- Display live search suggestions -->
  {#if results.length > 0}
    <ul class="absolute bg-white border w-full max-h-48 overflow-y-auto z-10">
      {#each results.slice(0, 5) as result}
        <li
          class="px-4 py-2 cursor-pointer hover:bg-gray-100"
          on:click={() => selectSuggestion(result)}
        >
          {result.name}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .searchbar {
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    border-bottom: 1px solid #eee;
  }
</style>