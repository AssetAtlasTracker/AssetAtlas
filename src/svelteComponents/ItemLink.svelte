<script lang="ts">
  import { createEventDispatcher } from "svelte";
  
  export let itemId: string;
  export let itemName: string = "";
  
  const dispatch = createEventDispatcher();
  
  function handleClick(event: MouseEvent) {
    event.preventDefault();
    console.log("ItemLink clicked:", itemId, itemName);
    dispatch("openItem", { id: itemId, name: itemName });
  }
</script>

<button class="clickable-text" on:click={handleClick}>
  <slot>{itemName}</slot>
</button>

