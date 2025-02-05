<script lang="ts">
    import { ip } from "../stores/ipStore.js";
    import Dialog from '../svelteComponents/Dialog.svelte';
    import "../svelteStyles/main.css";
    import {navigate } from "svelte-routing";
    
    export let itemId: any;
    export let dialog: HTMLDialogElement;
    
    
    let parentItemName = "";
    let parentItemId: string | null = null;
    let parentItemSuggestions: any[] = [];
    let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

  
    async function moveItem() {
      try {
        const response = await fetch('/api/items/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itemId: itemId,
                newParentId: parentItemId}),
    });
  
        if (response.ok) {
          console.log("item moved");
          navigate(`/view/${itemId}`);
          dialog.close();
        } else {
          //Show a popup with the error message from the server (we need to make this the more informative message)
          const errorMsg = await response.text();
          alert(`Error moving item: ${errorMsg}`);
          console.error("Failed to move item:", errorMsg);
        }
      } catch (error) {
        console.error("Error moving item:", error);
        alert("An unexpected error occurred while moving the item.");
      }
    }
    //Parent item search handlers
  function handleParentItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    parentItemName = target.value;
    parentItemId = null;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchParentItems(parentItemName);
    }, 300);
  }

  async function searchParentItems(query: string) {
    try {
      const response = await fetch(
        `http://${$ip}/api/items/search?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      parentItemSuggestions = data;
    } catch (err) {
      console.error("Error searching parent items:", err);
    }
  }

  function selectParentItem(item: { name: string; _id: string | null }) {
    parentItemName = item.name;
    parentItemId = item._id;
    parentItemSuggestions = [];
    if (item && item._id) {
      addToRecents('items', item);
    }
  }

  async function handleParentItemFocus() {
    if (!parentItemName) {
      parentItemSuggestions = await loadRecentItems('items');
    }
  }

  function resetForm() {
    parentItemName = "";
    parentItemId = null;
    parentItemSuggestions = [];
  }

  async function addToRecents(type: string, item: any) {
    console.log('DEBUG - addToRecents called with:', { type, item });
    try {
      const body = JSON.stringify({
        type,
        itemId: item._id,
      });
      console.log('DEBUG - Request body:', body);

      const response = await fetch(`http://${$ip}/api/recentItems/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const responseText = await response.text();
    

      if (!response.ok) {
        throw new Error(`Failed to add to recents: ${responseText}`);
      }
    } catch (err) {
      console.error('Error adding to recents:', err);
    }
  }
async function loadRecentItems(type: string) {
    
    try {
      const response = await fetch(`http://${$ip}/api/recentItems/${type}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error loading recent items:', err);
      return [];
    }
  }
  </script>

<Dialog bind:dialog on:close={resetForm}>
    <div class="flex flex-wrap space-x-4">
    <!-- Parent Item -->
    <label class="flex-1 min-w-[200px] relative">
        Move To:
        <input
        type="text"
        class="dark-textarea py-2 px-4 w-full"
        bind:value={parentItemName}
        on:input={handleParentItemInput}
        on:focus={handleParentItemFocus}
        on:blur={() => (parentItemSuggestions = [])}
        />
        {#if parentItemSuggestions.length > 0}
        <ul class="suggestions">
            {#each parentItemSuggestions as item}
            <button
                class="suggestion-item"
                type="button"
                on:mousedown={(e) => {
                e.preventDefault();
                selectParentItem(item);
                }}
            >
                {item.name}
            </button>
            {/each}
        </ul>
        {/if}
    </label>
    </div>
    <br>
    <button on:click={moveItem} class="border-button" type="submit">
        Submit
    </button>
    <br>
</Dialog>
