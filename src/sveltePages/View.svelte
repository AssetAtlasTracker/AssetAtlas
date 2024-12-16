<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton';
  import ItemDetails from '../svelteComponents/ItemDetails.svelte';
  import DeleteItem from '../svelteComponents/DeleteItem.svelte';
  import type { IBasicItemPopulated } from '../models/basicItem';
  import '../svelteStyles/view.css';
  
  export let params: { id?: string };
  console.log('View params:', params);
  
  import '../svelteStyles/home.css';
  import '../svelteStyles/main.css';

  let item: IBasicItemPopulated | null = null;

  $: if (params.id) {
    fetchItem(params.id);
  }

  async function fetchItem(id: string) {
    try {
      console.log('Fetching item from:', `/api/items/${id}`);
      
      const response = await fetch(`/api/items/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch item: ${response.status} ${response.statusText}`);
      }

      const data: IBasicItemPopulated = await response.json();
      item = data;
      console.log('Fetched item data:', item);
    } catch (err) {
      console.error('Error fetching item:', err);
      item = null;
    }
  }

  function goBack() {
    window.history.back();
  }//we gonna change this later fr fr

  function handleDelete() {
    console.log(`Item ${params.id} deleted.`);
    //go to the home page after successful deletion
    window.location.href = '/';
  }
</script>

<AppBar class="appbar-border glass"> 
  <button class="back-button" on:click={goBack}>
    ⬅ Back 
  </button>
</AppBar>

{#if item}
  <ItemDetails {item}/>
  <div class="delete-container">
    <DeleteItem itemId={params.id} onDelete={handleDelete}>
      <button
        class="border border-red-600 text-white bg-red-500 hover:bg-red-700 hover:border-red-800 font-semibold shadow-md rounded-lg px-4 py-2 transition duration-200"
      >
        Delete Item
      </button>
    </DeleteItem>
  </div>
{:else}
  <p>Loading item data...</p>
{/if}

  