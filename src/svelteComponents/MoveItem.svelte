<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { actionStore } from "../stores/actionStore.js";

  export let itemId: string | undefined;
  let parentItemName = "";
  let parentItemId: string | null = null;
  let suggestions: any[] = [];

  const dispatch = createEventDispatcher();

  async function handleMove() {
    if (!parentItemId || !itemId) return;

    try {
      const response = await fetch(`/api/items/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: itemId,
          newParentId: parentItemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to move item");
      }

      actionStore.addMessage("Item moved successfully");
      dispatch("close");
      location.reload();
    } catch (err) {
      console.error("Error moving item:", err);
      actionStore.addMessage("Error moving item");
    }
  }

  async function searchItems(query: string) {
    try {
      const response = await fetch(
        `/api/items/search?name=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      suggestions = data;
    } catch (err) {
      console.error("Error searching items:", err);
    }
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    parentItemName = target.value;
    parentItemId = null;
    searchItems(parentItemName);
  }

  function selectItem(item: any) {
    parentItemName = item.name;
    parentItemId = item._id;
    suggestions = [];
  }
</script>

<div class="flex flex-col space-y-4 p-4">
  <label class="relative">
    New Parent:
    <input
      type="text"
      class="dark-textarea py-2 px-4 w-full"
      bind:value={parentItemName}
      on:input={handleInput}
    />
    {#if suggestions.length > 0}
      <ul class="small-dialog-suggestions">
        {#each suggestions as item}
          <button class="suggestion-item" on:click={() => selectItem(item)}>
            {item.name}
          </button>
        {/each}
      </ul>
    {/if}
  </label>

  <button
    class="success-button font-semibold shadow mt-4 w-full block"
    disabled={!parentItemId}
    on:click={handleMove}
  >
    Move Item
  </button>
</div>
