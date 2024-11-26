<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton';
    import SearchBar from "../svelteComponents/SearchBar.svelte";
    import Dialog from '../svelteComponents/Dialog.svelte';
  
    let ip = process.env.IP; // default to 3000
    fetchIp();
  
    // Form inputs
    let name = '';
    let description = '';
    let tags = '';
    let containedItems = '';
    let searchQuery = '';
    let searchResults: any[] = []; // Array for fetched items
    let dialog: { showModal: () => any; };
  
    // Fetch IP dynamically
    async function fetchIp() {
      try {
        const response = await fetch('/api/ip');
        const data = await response.json();
        ip = data.ip;
        console.log('IP fetched from server:', ip);
      } catch (err) {
        console.error('Error fetching IP:', err);
      }
    }
  
    // Search functionality
    async function handleSearch(query: string) {
      searchQuery = query;
      try {
        const response = await fetch(`http://${ip}/api/items/search?name=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
  
        const rawResponse = await response.text();
        const contentType = response.headers.get('Content-Type');
  
        if (!response.ok) throw new Error('Failed to fetch items');
        if (contentType && contentType.includes('application/json')) {
          const data = JSON.parse(rawResponse);
          searchResults = data;
        } else {
          console.error('Response is not JSON:', rawResponse);
        }
      } catch (err) {
        console.error('Error searching items:', err);
      }
    }
  
    // Create item
    async function handleCreateItem() {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      const containedItemsArray = containedItems.split(',').map(item => item.trim());
  
      try {
        const response = await fetch(`http://${ip}/api/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, tags: tagsArray, containedItems: containedItemsArray }),
        });
        const data = await response.json();
        console.log('Item created:', data);
  
        // Reset form
        name = '';
        description = '';
        tags = '';
        containedItems = '';
      } catch (err) {
        console.error('Error creating item:', err);
      }
    }
  </script>
  
  <AppBar class="border-gray-400 shadow" background="bg-white">
    <svelte:fragment slot="lead">(actions)</svelte:fragment>
    <div class="flex px-4 grid grid-cols-4">
      <div class="text-2xl font-bold">Asset Atlas</div>
      <div class="flex-auto pb-4">
        <SearchBar searchQuery={searchQuery} onSearch={handleSearch} />
      </div>
    </div>
    <svelte:fragment slot="trail">(profile icon)</svelte:fragment>
  </AppBar>
  
  <div class="body">
    <!-- Display search results -->
    {#if searchResults.length > 0}
      <div class="rounded bg-white page-component">
        <h2 class="text-center font-bold">Search Results:</h2>
        <ul>
          {#each searchResults as item}
            <li>{item.name}: {item.description}</li>
            <hr>
          {/each}
        </ul>
      </div>
    {:else if searchQuery !== ''}
      <div class="rounded bg-white page-component">
        <p>No items found for "{searchQuery}".</p>
      </div>
    {/if}
  
    <!-- Add item button -->
    <button class="add-btn text-icon text-gray-800 font-bold bg-white hover:bg-gray-100 border-gray-400 rounded-full shadow border" on:click={() => dialog.showModal()}>
      +
    </button>
  
    <!-- Dialog for creating new items -->
    <Dialog bind:dialog on:close={() => console.log('closed')}>
      <div class="rounded bg-white page-component">
        <h1 class="font-bold">Create New Item</h1>
        <form on:submit|preventDefault={handleCreateItem}>
          <div class="flex internal-component rounded">
            <label>
              Name:
              <input class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" type="text" placeholder="Toolbox" bind:value={name} required />
            </label>
  
            <label>
              Description:
              <textarea rows="5" class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" placeholder="Medium-sized, red toolbox" style="resize: none" bind:value={description} />
            </label>
  
            <label>
              Tags (comma-separated):
              <textarea class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" placeholder="Container,Work" style="resize: none" bind:value={tags} />
            </label>
  
            <label>
              Contained Items (comma-separated IDs):
              <textarea class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" style="resize: none" bind:value={containedItems} />
            </label>
          </div>
  
          <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow" type="submit">
            Create Item
          </button>
        </form>
      </div>
    </Dialog>
  </div>
  
  <style src="../svelteStyles/home.css"></style>