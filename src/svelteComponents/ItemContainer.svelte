<script lang="ts">
    export let items: string | any[] = [];
  </script>

  {#if items.length > 0}
  <div class="rounded bg-white page-component">
    {#each items as item}
      <div class="rounded item-card">  
        <div class="item">{item.name}</div>
        <div class="item">Location: {item.parentItem}</div>
        <div class="item desc">Description: {item.description}</div>
      </div>
      <br>
    {/each}
  </div>
  {:else}
    <p>No items found.</p>
  {/if}
  
  <style>
    .page-component{
      margin: 1.5rem;
      padding: 1.5rem;
      box-shadow: 5px 5px 8px -8px slategray
    }
  
    .item-card {
      box-sizing: border-box;
      width: 95%;
      margin: 0 auto;
      padding: 20px;
      background-color: rgb(116, 116, 116);
      box-shadow: 5px 5px 8px -8px slategray
    }

    .item {
      display: inline-block;
      width: 25%;
    }

    .desc {
      width: 40%;
    }
  </style>