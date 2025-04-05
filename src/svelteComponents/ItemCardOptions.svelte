<script lang="ts">
    import type { IBasicItemPopulated } from "../models/basicItem.js";
    import CreateItem from "./CreateItem.svelte";
    import Duplicate from "./Duplicate.svelte";

    export let item: IBasicItemPopulated;

    let createDialog: HTMLDialogElement;
    let duplicateDialog: HTMLDialogElement;
    let creator: CreateItem;
    let duplicator: Duplicate;
    let selectedItem: IBasicItemPopulated | null = null;

    let unique = {};

    function duplicateFunction(item: IBasicItemPopulated) {
        duplicator.changeItem(item);
        duplicateDialog.showModal();
    }

    function duplicateEditFunction(item: IBasicItemPopulated) {
        creator.changeItem(item);
        createDialog.showModal();
    }

    export function setItem(newItem: IBasicItemPopulated) {
        item = newItem;
    }
</script>

<!-- TODO: Should probably rename file and references to something more fitting-->
<div class="simple-flex">
    <!--Replace text with icons-->
    <button class="border-button" type="button" on:click={() => duplicateFunction(item)}
        >Duplicate</button
    >
    <button class="border-button" type="button" on:click={() => duplicateEditFunction(item)}
        >Duplicate and Edit</button
    >
</div>

{#key unique}
    <CreateItem
        bind:dialog={createDialog}
        bind:this={creator}
        item={selectedItem}
        duplicate={true}
        on:close={() => createDialog?.close()}
    />
{/key}

{#key unique}
    <Duplicate
        bind:dialog={duplicateDialog}
        bind:this={duplicator}
        item={item}
        on:close={() => duplicateDialog?.close()}
    />
{/key}
