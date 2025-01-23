<script>
  import { actionStore } from '../stores/actionStore';
  import { navigate, Link } from 'svelte-routing';
  export let itemId;
  export let onDelete = () => {};

  async function deleteItem() {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(itemId);
        actionStore.addMessage('Item deleted successfully!');
        //Use the same navigation pattern that ItemContainer uses (IF WE DONT DO THIS THEN POPUP DISAPPEARS)
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        console.error("Failed to delete item:", await response.text());
        actionStore.addMessage('Error deleting item');
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      actionStore.addMessage('Error deleting item');
    }
  }
</script>

<button on:click={deleteItem} class="warn-button">
  <slot></slot>
</button>
