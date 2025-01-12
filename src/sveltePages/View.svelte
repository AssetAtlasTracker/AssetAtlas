<script lang="ts">
  import ItemDetails from "../svelteComponents/ItemDetails.svelte";
  import DeleteItem from "../svelteComponents/DeleteItem.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import EditItem from "../svelteComponents/EditItem.svelte";

  import type { IBasicItemPopulated } from "../models/basicItem";

  import "../svelteStyles/main.css";

  export let params: { id?: string };
  //console.log('View params:', params);

  let item: IBasicItemPopulated | null = null;
  export let dialog: HTMLDialogElement;

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

<TopBar searchQuery={""}></TopBar>

{#if item}
  <div class="item-view glass page-component">
    <ItemDetails {item} />

    <!-- Flex these buttons (?) -->
    <br />
    <div class="delete-container">
      <DeleteItem itemId={params.id} onDelete={handleDelete}>
        <button class="font-semibold"> Delete Item </button>
      </DeleteItem>
    </div>

    <br />
    <button class="border-button" on:click={() => dialog.showModal()}>
      Edit Item
    </button>

    <EditItem {item} bind:dialog />
  </div>
{:else}
  <p>Loading item data...</p>
{/if}
