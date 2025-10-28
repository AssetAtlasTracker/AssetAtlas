<script lang="ts">
  export let items: string | any[] = [];
</script>

{#if items.length > 0}
  <ul>
    {#each items as item}
      <li>
        {item.name}: {item.description}
      </li>
    {/each}
  </ul>
{:else}
  <p>No items found.</p>
{/if}

