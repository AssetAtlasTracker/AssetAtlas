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

	let isConfirmationOpen = $state(false);

	onMount(() => {
		create?.();
	});

	function openConfirmation() {
		isConfirmationOpen = true;
	}

	function closeConfirmation() {
		isConfirmationOpen = false;
	}

	function handleClose(event?: Event) {
		event?.preventDefault();

		if (requireCloseConfirmation) {
			if (isConfirmationOpen) {
				closeConfirmation();
			} else {
				openConfirmation();
			}
			return;
		}

		closeDialog();
	}

	function closeDialog() {
		closeConfirmation();
		dialog?.close();
		close();
	}
</script>

<dialog
	oncancel={handleClose}
	onkeydown={(event) => {
		if (event.key === "Escape") {
			handleClose(event);
		}
	}}
	class="glass dialog-component self-center {isLarge
		? 'large-dialog-noscroll'
		: ''}"
	style="overflow: {canOverflow ? 'visible' : 'auto'}"
	bind:this={dialog}>
	<button class="x-button" onclick={handleClose}>X</button>
	{@render children?.()}
	{#if requireCloseConfirmation && isConfirmationOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div class="glass dialog-component self-center w-1/3 align-center">
				<div class="flex flex-col align-center justify-center h-full w-full">
					<div class="important-text wrap-break-word text-center">Are you sure?</div>
					<div class="flex justify-center gap-4">
						<button class="flex-1 success-button font-semibold shadow mt-4" onclick={closeDialog}>
							Exit
						</button>
						<button class="flex-1 warn-button font-semibold shadow mt-4" onclick={closeConfirmation}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</dialog>
