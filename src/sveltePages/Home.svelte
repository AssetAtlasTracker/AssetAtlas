<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton';
  import SearchBar from "../svelteComponents/SearchBar.svelte";
  import Dialog from '../svelteComponents/Dialog.svelte';
  import Menu from '../svelteComponents/Menu.svelte';
  import ItemContainer from '../svelteComponents/ItemContainer.svelte'
  import IoIosMenu from 'svelte-icons/io/IoIosMenu.svelte'

  import '../svelteStyles/home.css';
  import '../svelteStyles/main.css';
  
  let ip = process.env.IP; // default to 3000
  fetchIp();
  
  // Form inputs
  let name = '';
  let description = '';
  let tags = '';
  let parentItemName = '';
  let parentItemId: string | null = null;
  let containedItems = '';
  let searchQuery = '';
  let searchResults: any[] = []; // Array for fetched items
  let dialog: { showModal: () => any; };
  let menu: { showModal: () => any; };
  let parentItemSuggestions: any[] = [];
  let parentItemDebounceTimeout: number | undefined;

  // UI variables
  let menuOpen = false;
  
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
    handleSearch("");
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
    const tagsArray = tags.split(',').map((tag) => tag.trim());

    try {
      const response = await fetch(`http://${ip}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          tags: tagsArray,
          parentItemId, // Include parentItemId in the request body
        }),
      });
      const data = await response.json();
      console.log('Item created:', data);

      // Reset form
      name = '';
      description = '';
      tags = '';
      parentItemName = '';
      parentItemId = null;
    } catch (err) {
      console.error('Error creating item:', err);
    }
  }

  function handleParentItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    parentItemName = target.value;
    parentItemId = null; // Reset parentItemId when user types
    if (parentItemDebounceTimeout) clearTimeout(parentItemDebounceTimeout);
    parentItemDebounceTimeout = setTimeout(() => {
      searchParentItems(parentItemName);
    }, 300);
  }

  async function searchParentItems(query: string) {
    try {
      const response = await fetch(`http://${ip}/api/items/search?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      parentItemSuggestions = data;
    } catch (err) {
      console.error('Error searching parent items:', err);
    }
  }

  function selectParentItem(item: { name: string; _id: string | null; }) {
    parentItemName = item.name;
    parentItemId = item._id; // Use the actual ID field from your data
    parentItemSuggestions = [];
  }

  function handleClickMenu() {
    console.log("Menu Clicked");
    menuOpen = !menuOpen;
    if (menuOpen) {
      showMenu();
    } else {
      hideMenu();
    }
  }

  function showMenu() {
    menu.showModal()
  }

  function hideMenu() {
  }

</script>

<AppBar class="appbar-border glass">
  <svelte:fragment slot="lead">
    <button on:click={handleClickMenu}>
      (icon)
    </button>
  </svelte:fragment>
  <div class="px-4">
    <div id="title" class="nav-margin text-2xl font-bold">
      Asset Atlas
    </div>
    <div class="nav-margin flex-auto pb-4">
      <SearchBar 
         searchQuery={searchQuery} 
         onSearch={handleSearch} 
        />
    </div>
  </div>
  <svelte:fragment slot="trail">
    (profile icon)
  </svelte:fragment>
</AppBar>
  
<div class="body">
  <!-- Display search results -->
  {#if searchResults.length > 0}
      <ItemContainer items={searchResults}/>
    {:else if searchQuery !== ''}
      <div class="rounded bg-white page-component">
        <p>No items found for "{searchQuery}".</p>
      </div>
    {/if}
  
  <!-- Add item button -->
  <button class="add-button text-icon
      text-gray-800 font-bold bg-white hover:bg-gray-100 
      rounded-full shadow border" on:click={() => dialog.showModal()}>
    +
  </button>

<!-- Menu for navigation - Slides out -->
<Menu bind:menu on:close={() => console.log('menu closed')}>
  <h1>THE GLORIOUS EVOLUTION!</h1>
</Menu>
  
<!-- Dialog for creating new items -->
<Dialog bind:dialog on:close={() => console.log('closed')}>
    <h1 id="underline-header" class="font-bold text-center">
      Create New Item
    </h1>
    <div class="rounded page-component">
      <form on:submit|preventDefault={handleCreateItem}>
        <div class="flex flex-wrap internal-component rounded">
          <!-- Name -->
          <label class="px-4 flex-1 min-w-[200px]">
            Name:
            <br />
            <input
              class="dark-textarea text-gray-800 py-2 px-4 w-full"
              type="text"
              placeholder="Toolbox"
              bind:value={name}
              required
            />
          </label>
  
          <!-- Description -->
          <label class="px-4 flex-1 min-w-[200px]">
            Description:
            <br />
            <textarea
              rows="5"
              class="dark-textarea text-gray-800 py-2 px-4 w-full"
              placeholder="My medium-sized, red toolbox"
              bind:value={description}
            />
          </label>
  
          <!-- Tags -->
          <label class="px-4 flex-1 min-w-[200px]">
            Tags:
            <br />
            <textarea
              class="dark-textarea text-gray-800 py-2 px-4 w-full"
              bind:value={tags}
            />
          </label>
  
          <!-- Parent Item -->
        <label class="px-4 flex-1 min-w-[200px] relative">
            Parent Item:
            <br />
            <input
              type="text"
              class="dark-textarea text-gray-800 py-2 px-4 w-full"
              bind:value={parentItemName}
              on:input={handleParentItemInput}
            />
            <!-- Display live search suggestions for parent item -->
            {#if parentItemSuggestions.length > 0}
              <ul class="suggestions">
                {#each parentItemSuggestions.slice(0, 5) as item}
                  <li
                    on:click={() => selectParentItem(item)}
                  >
                    {item.name}
                  </li>
                {/each}
              </ul>
            {/if}
          </label>
        </div>
  
        <button
          class="border-button hover:bg-gray-100 font-semibold shadow mt-4"
          type="submit"
        >
          Create Item
        </button>
      </form>
    </div>
  </Dialog>
</div>
