<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { IBasicItemPopulated } from "../models/basicItem.js";
    import DeleteItem from "./DeleteItem.svelte";
    import Dialog from "./Dialog.svelte";
    import MoveItem from "./MoveItem.svelte";

    const dispatch = createEventDispatcher();
    let action = "";
    let items: IBasicItemPopulated[];
    let deleter: DeleteItem;
    let mover: MoveItem;

    let dialog: HTMLDialogElement;


    export function setAction(newAction: string) {
        action = newAction;
    }

    export function setItems(newItems: IBasicItemPopulated[]) {
        items = newItems;
    }

    function handleAction() {
        if (action == "delete" ) {
            for (let i = 0; i < items.length; i ++) {
                console.log(items[i]);
                deleter.deleteExternalItem(items[i]._id);
            }
            dispatch("close");
            dialog.close();
        }
    }
</script>


{#if action == "move"}
<MoveItem itemId="" items={items} bind:this={mover}/>
{:else}
<button
    class="success-button font-semibold shadow mt-4 w-full block"
    on:click={handleAction}
  >
    Are you sure you want to {action} these items?
</button>
<Dialog bind:dialog={dialog}><DeleteItem itemId="" bind:this={deleter}/>
</Dialog>
{/if}
