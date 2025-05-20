<script>
  export let itemId;
  export let parentId;
  import { navigate } from "svelte-routing";
  

  async function returnItem() {
    try {
      const response = await fetch("/api/items/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: itemId,
          newParentId: parentId,
        }),
      });

      if (response.ok) {
        console.log("Item returned to home");
        location.reload();
      } else {
        console.error("Failed to move item:", await response.text());
      }
    } catch (error) {
      console.error("Error moving item:", error);
    }
  }
</script>

<button
  on:click={returnItem}
  class="success-button font-semibold shadow mt-4 w-full block"
>
  Submit
</button>
