<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton';
  import ItemDetails from '../svelteComponents/ItemDetails.svelte';
  import type { IBasicItemPopulated } from '../models/basicItem';
  
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
</script>

<AppBar class="appbar-border glass"> 
  <button class="back-button" on:click={goBack}>
    ⬅ Back 
  </button>
</AppBar>

{#if item}
  <ItemDetails {item} />
{:else}
  <p>Loading item data...</p>
{/if}

  