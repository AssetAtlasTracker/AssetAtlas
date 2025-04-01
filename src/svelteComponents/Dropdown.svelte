<script lang="ts">
    import type { IBasicItemPopulated } from "../models/basicItem.js";
    import Dialog from "./Dialog.svelte";



    export let item: IBasicItemPopulated
    export let dialog: HTMLDialogElement;

    let duplicateFunc: Function = () =>{};
    let duplicateEditFunc: Function = () =>{};
    
    export function setItem(newItem: IBasicItemPopulated) {
        item = newItem;
    }

    export function setDuplicateFunction(newFunc: Function){
        duplicateFunc = newFunc;
    }

    export function setDuplicateEditFunction(newFunc: Function){
        duplicateEditFunc = newFunc;
    }


</script>

<Dialog bind:dialog>
    <button class="border-button" type="button" on:click={duplicateFunc()}>Duplicate</button>
    <button class="border-button" type="button" on:click={duplicateEditFunc()}>Duplicate and Edit</button>
</Dialog>