<script>
  export let dialog;
  export let isLarge = false;
</script>

<dialog class="glass dialog-component self-center {isLarge ? 'large-dialog-noscroll' : ''}" bind:this={dialog} on:close>
  <button class="x-button" on:click={() => dialog.close()}> X </button>
  <slot />
</dialog>
