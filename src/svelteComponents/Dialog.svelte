<script>
    export let dialog;
</script>

<dialog class="glass page-component center-dialog" bind:this={dialog} on:close>
    <button
        class="close-button border-button hover:bg-primary-900 font-semibold shadow"
        on:click={() => dialog.close()}
    >
        Cancel
    </button>
    <slot />
</dialog>

<style>
    ::backdrop {
        background: rgba(var(--color-surface-900) / 0.7);
    }

    .center-dialog {
        align-self: center;
        justify-self: center;
    }

    .close-button {
        margin: 1rem 0rem 0rem 1rem;
    }
</style>
