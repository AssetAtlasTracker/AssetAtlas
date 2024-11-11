<script>
    export let dialog
</script>

<dialog class="rounded bg-white page-component" bind:this={dialog} on:close>
    <slot/>
</dialog>