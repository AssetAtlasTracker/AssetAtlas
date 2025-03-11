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

<button class="item-link" on:click={handleClick}>
  <slot>{itemName}</slot>
</button>

<style>
  .item-link {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    color: #0066cc;
    cursor: pointer;
    text-decoration: underline;
    display: inline;
    font: inherit;
    text-align: left;
  }
  
  .item-link:hover {
    color: #004080;
  }
</style>
