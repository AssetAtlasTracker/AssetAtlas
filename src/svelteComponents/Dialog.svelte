<script>
    export let dialog
</script>

<dialog class="glass page-component" 
        style="align-self: center; justify-self: center;" 
        bind:this={dialog} on:close>
    <button style="margin: 1rem 0rem 0rem 1rem" 
            class="border-button hover:bg-gray-100 font-semibold shadow" 
            on:click={() => dialog.close()}>
        Cancel
    </button>
    <slot/>
</dialog>