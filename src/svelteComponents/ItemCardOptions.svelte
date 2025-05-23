<!-- Icons from: 
 Font Awesome Free 6.7.2 by @fontawesome 
 - https://fontawesome.com License 
 - https://fontawesome.com/license/free 
 Copyright 2025 Fonticons, Inc.-->

<script lang="ts">
    import type { IBasicItemPopulated } from "../models/basicItem.js";
    import { createEventDispatcher } from "svelte";
    import CreateItem from "./CreateItem.svelte";
    import Duplicate from "./Duplicate.svelte";

    export let item: IBasicItemPopulated;

    const dispatch = createEventDispatcher();
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

    function onCreated() {
        dispatch("itemCreated");
    }

    export function setItem(newItem: IBasicItemPopulated) {
        item = newItem;
    }
</script>

<div class="simple-flex">
    <!--Duplicate button-->
    <button
        class="border-button hoverable"
        type="button"
        on:click={() => duplicateFunction(item)}
    >
        <span class="hovertiptext">Duplicate</span>
        <svg
            class="icon-small"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            ><path
                fill="#ffffff"
                d="M288 448L64 448l0-224 64 0 0-64-64 0c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-64-64 0 0 64zm-64-96l224 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L224 0c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64z"
            /></svg
        ></button
    >
    <!--Duplicate and Edit button-->
    <button
        class="border-button hoverable"
        type="button"
        on:click={() => duplicateEditFunction(item)}
    >
        <span class="hovertiptext">Duplicate and edit</span>
        <svg
            class="icon-small"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            ><path
                fill="#ffffff"
                d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"
            /></svg
        ></button
    >
</div>

{#key unique}
    <CreateItem
        bind:dialog={createDialog}
        bind:this={creator}
        item={selectedItem}
        duplicate={true}
        on:itemCreated={onCreated}
        on:close={() => createDialog?.close()}
    />
{/key}

{#key unique}
    <Duplicate
        bind:dialog={duplicateDialog}
        bind:this={duplicator}
        {item}
        on:itemCreated={onCreated}
        on:close={() => duplicateDialog?.close()}
    />
{/key}
