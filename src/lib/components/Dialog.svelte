<script lang="ts">
	import { onMount } from "svelte";
	let {
		dialog = $bindable(),
		isLarge = false,
		close,
		create,
		children,
		canOverflow = false,
		requireCloseConfirmation = false
	}: {
		dialog: HTMLDialogElement | undefined;
		isLarge: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		close: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		create?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
		canOverflow: boolean;
		requireCloseConfirmation: boolean;
	} = $props();

	let closeConfirmationDialog: HTMLDialogElement | undefined = $state(undefined);

	onMount(() => {
		closeConfirmationDialog?.close();
		create?.();
	});

	function handleClose(event: CustomEvent) {
		if (requireCloseConfirmation) {
			event.preventDefault();
			closeConfirmationDialog?.showModal();
		} else {
			closeDialog();
		}
	}

	function closeDialog() {
		closeConfirmationDialog?.close();
		dialog?.close();
		close();
	}
</script>

<dialog
	oncancel={handleClose}
	class="glass dialog-component self-center {isLarge
		? 'large-dialog-noscroll'
		: ''}"
	style="overflow: {canOverflow ? 'visible' : 'auto'}"
	bind:this={dialog}>
	<button class="x-button" onclick={handleClose}>X</button>
	{@render children?.()}
</dialog>

{#if requireCloseConfirmation}
	<dialog
		class="glass dialog-component self-center w-1/3 align-center"
		closedby="any"
		bind:this={closeConfirmationDialog}>
		<div class="flex flex-col align-center justify-center h-full w-full">
			<div class="important-text wrap-break-word text-center">Are you sure?</div>
			<div class="flex justify-center gap-4">
				<button class="flex-1 success-button font-semibold shadow mt-4" 
					onclick={closeDialog}>
					Exit
				</button>
				<button class="flex-1 warn-button font-semibold shadow mt-4" 
					onclick={()=>{closeConfirmationDialog?.close();}}>
					Cancel
				</button>
			</div>
		</div>
	</dialog>
{/if}
