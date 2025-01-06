<script lang="ts">
  import ItemDetails from "../svelteComponents/ItemDetails.svelte";
  import DeleteItem from "../svelteComponents/DeleteItem.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";

  import type { IBasicItemPopulated } from "../models/basicItem";

  import "../svelteStyles/main.css";

  export let params: { id?: string };
  //console.log('View params:', params);

  let item: IBasicItemPopulated | null = null;

  import Menu from '../svelteComponents/Menu.svelte';
  export let menu : HTMLDialogElement;

  $: if (params.id) {
    fetchItem(params.id);
  }

  async function fetchItem(id: string) {
    try {
      console.log("Fetching item from:", `/api/items/${id}`);

      const response = await fetch(`/api/items/${id}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch item: ${response.status} ${response.statusText}`,
        );
      }

      const data: IBasicItemPopulated = await response.json();
      item = data;
      console.log("Fetched item data:", item);
    } catch (err) {
      console.error("Error fetching item:", err);
      item = null;
    }
  }

  function goBack() {
    window.history.back();
  } //we gonna change this later fr fr

  function handleDelete() {
    console.log(`Item ${params.id} deleted.`);
    //go to the home page after successful deletion
    window.location.href = "/";
  }
</script>

<TopBar searchQuery={""} menu={menu}></TopBar>

<Menu bind:menu />

{#if item}
  <div class="page-component glass">
    <ItemDetails {item} />
    <br />
    <DeleteItem itemId={params.id} onDelete={handleDelete}>
      <button class="font-semibold"> Delete Item </button>
    </DeleteItem>
  </div>
{:else}
  <p>Loading item data...</p>
{/if}
