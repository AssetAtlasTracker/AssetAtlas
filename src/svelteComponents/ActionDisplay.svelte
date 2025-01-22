<script lang="ts">
  import { actionStore } from '../stores/actionStore';
  import { fade } from 'svelte/transition';
</script>

<div class="action-container">
  {#each $actionStore as message (message.id)}
    <div class="action-message" transition:fade>
      {message.text}
    </div>
  {/each}
</div>

<style>
  .action-container {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
  }

  .action-message {
    background-color: rgba(var(--custom-blue) / 0.9);
    color: rgb(var(--on-custom-blue));
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    text-align: center;
  }
</style>
