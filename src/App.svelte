<!-- to be our page that we go to and stuff -->
<script lang="ts">
  console.log('Hello World');
  import { AppBar } from '@skeletonlabs/skeleton';
  import SearchBar from "./svelteComponents/SearchBar.svelte";
  import ItemList from "./svelteComponents/ItemList.svelte";
  //let message = "Asset Atlas";
  let ip = process.env.IP//default to 3000
  fetchIp();
  let name = '';
  let description = '';
  let tags = '';
  let containedItems = '';
  let searchQuery = '';
  let searchResults: any[] = []; //array of anything or a specific type


  async function fetchIp() {
    try {
      const response = await fetch('/api/ip');
      //const textData = await response.text();//for debug
      //console.log('Raw response:', textData);//for debug
      //const data = JSON.parse("reponse" + textData);
      const data = await response.json();
      ip = data.ip;
      console.log('IP fetched from server:', ip);
    } catch (err) {
      console.error('Error fetching IP:', err);
    }
  }

  async function handleSearch(query: string) {
  searchQuery = query;
  try {
    const response = await fetch(`http://${ip}/api/items/search?name=${encodeURIComponent(searchQuery)}`
    , {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  
  );

    const contentType = response.headers.get('Content-Type');
    console.log('Content-Type:', contentType);

    const rawResponse = await response.text();
    console.log('Raw response:', rawResponse);  //This should print the raw response

    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }

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

  //create item
  async function handleCreateItem(){
    const tagsArray = tags.split(',').map(tag=>tag.trim());
    const containedItemsArray = containedItems.split(',').map(item=>item.trim());

    try{
      console.log(ip)
      const response = await fetch(`http://${ip}/api/items`,{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          tags: tagsArray,
          containedItems: containedItemsArray
        })
      });
      // if (!response.ok){
      //   throw new Error('Failed to create item');
      // }
      const data = await response.json();
      console.log('Item created:', data);
      name = '';
      description = '';
      tags = '';
      containedItems = '';
    } catch (err) {
      console.error('Error creating item:', err);
    }
    }
  </script>

<!-- Gridding is not working as intended, likely something to do with a config file -->
<AppBar class="border-gray-400 shadow" background="bg-white">
  <svelte:fragment slot="lead">(actions)</svelte:fragment>
  <div class="flex px-4 grid grid-cols-4">
    <div class="text-2xl font-bold">Asset Atlas</div>
    <div class="flex-auto pb-4"><SearchBar searchQuery={searchQuery} onSearch={handleSearch}/></div>
  </div>
  <svelte:fragment slot="trail">(profile icon)</svelte:fragment>
</AppBar>

<div class="body">
  <!-- <h1>{message}</h1> -->
  <div class="rounded bg-white page-component">
    <h1 class="font-bold">Create New Item</h1>

    <form on:submit|preventDefault={handleCreateItem}>
      <div class="flex internal-component rounded">
        <label class="py-2">
          Name:
          <input class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded"
          type="text" 
          placeholder="Toolbox"
          bind:value={name} required />
        </label>

        <label class="py-2">
          Description:
          <input class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" 
          type="text" 
          placeholder="Medium-sized, red toolbox"
          bind:value={description} />
        </label>

        <label class="py-2">
          Tags (comma-separated):
          <input class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" 
          type="text" 
          placeholder="Container,Work"
          bind:value={tags} />
        </label>

        <label class="py-2">
          Contained Items (comma-separated IDs):
          <input class="flex-auto bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded" 
          type="text"
          bind:value={containedItems} />
        </label>
      </div>

      <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
              type="submit">Create Item</button>
    </form>
  </div>

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

  <button class="add-btn
          text-icon text-gray-800 font-bold
          bg-white hover:bg-gray-100 border-gray-400
          rounded-full shadow border">
          +
  </button>
</div>

<style>
  .page-component{
    margin: 1.5rem;
    padding: 1.5rem;
    box-shadow: 5px 5px 8px -8px slategray
  }

  .internal-component{
    margin: 1rem 0;
    padding: 1rem;
    background-color: #E4E6EE;
    box-shadow: inset 5px 5px 8px -8px slategray
  }

  .add-btn{
    padding: 1rem 1.25rem 1.55rem;
    position: absolute;
    bottom: 4rem;
    right: 4rem;
  }
</style>