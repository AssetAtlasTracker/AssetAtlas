<script lang="ts">
	let {
		dialog = $bindable(),
		isLarge = false,
		create,
		close,
		children,
	}: {
		dialog: HTMLDialogElement | undefined;
		isLarge: boolean;
		create: any;
		close: any;
		children: any;
	} = $props();

	function handleClose() {
		dialog?.close();
		close();
	}
</script>

<dialog
	class="glass dialog-component self-center {isLarge
		? 'large-dialog-noscroll'
		: ''}"
	bind:this={dialog}>
	<button class="x-button" onclick={handleClose}>X</button>
	{@render children?.()}
</dialog>
