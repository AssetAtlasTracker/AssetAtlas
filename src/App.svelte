<!-- to be our page that we go to and stuff -->

<script lang="ts">
  console.log('App maybe working');
  import SearchBar from "./svelteComponents/SearchBar.svelte";
  import ItemList from "./svelteComponents/ItemList.svelte";
  let message = "Asset Atlas";
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
    const response = await fetch(`http://${ip}/items/search?name=${encodeURIComponent(searchQuery)}`);

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
      const response = await fetch(`http://${ip}/item`,{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          tags: tagsArray,
          containedItems: containedItemsArray.length > 0 ? containedItemsArray: undefined
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

<main>
  <h1>{message}</h1>
  <h1>Create New Item</h1>

  <form on:submit|preventDefault={handleCreateItem}>
    <label>
      Name:
      <input type="text" bind:value={name} required />
    </label>

    <label>
      Description:
      <input type="text" bind:value={description} />
    </label>

    <label>
      Tags (comma-separated):
      <input type="text" bind:value={tags} />
    </label>

    <label>
      Contained Items (comma-separated IDs):
      <input type="text" bind:value={containedItems} />
    </label>

    <button type="submit">Create Item</button>
  </form>

  <h1>Item Search</h1>
  
  <!-- Search Bar Component -->
  <SearchBar searchQuery={searchQuery} onSearch={handleSearch} />

  <!-- Display search results -->
  {#if searchResults.length > 0}
    <h2>Search Results:</h2>
    <ul>
      {#each searchResults as item}
        <li>{item.name}: {item.description}</li>
      {/each}
    </ul>
  {:else if searchQuery !== ''}
    <p>No items found for "{searchQuery}".</p>
  {/if}

  </main>

  <style>
    main {
      padding: 20px;
      text-align: center;
    }
  </style>