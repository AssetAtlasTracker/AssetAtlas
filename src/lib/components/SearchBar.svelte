<script lang="ts">
  import { onMount } from 'svelte';

  export let searchQuery: string = "";
  export let onSearch: (query: string) => void;
  export let results: { name: string }[] = [];

  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
  
  $: if (mounted && searchQuery !== undefined) {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
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
    <ul class="suggestions">
      {#each results as result}
        <button
          class="suggestion-item"
          type="button"
          on:click={() => selectSuggestion(result)}
        >
          {result.name}
        </button>
      {/each}
    </ul>
  {/if}
</div>