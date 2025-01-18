<script>
  export let dialog;
</script>

<dialog class="glass dialog-component self-center" bind:this={dialog} on:close>
  <button class="x-button" on:click={() => dialog.close()}> X </button>
  <slot />
</dialog>
