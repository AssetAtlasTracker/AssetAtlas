<script lang="ts">
  export let dialog: HTMLDialogElement | undefined;
  export let isLarge: boolean = false;
</script>

<dialog
  class="glass dialog-component self-center {isLarge
    ? 'large-dialog-noscroll'
    : ''}"
  bind:this={dialog}
>
  <button class="x-button" on:click={() => dialog?.close()}>X</button>
  <slot />
</dialog>
