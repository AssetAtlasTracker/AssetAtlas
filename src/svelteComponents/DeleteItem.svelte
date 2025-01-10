<script>
  export let itemId;
  export let onDelete = () => {}; //doesnt do anything rn

  async function deleteItem() {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(itemId);
      } else {
        console.error("Failed to delete item:", await response.text());
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }
</script>

<button on:click={deleteItem} class="warn-button">
  <slot></slot>
</button>
