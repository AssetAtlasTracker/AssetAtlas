<script lang="ts">
	import ActionDisplay from "./ActionDisplay.svelte";
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
	bind:this={dialog}
	oncancel={handleClose}>
	<button class="x-button" onclick={handleClose}>X</button>
	{@render children?.()}
	<div style="position: relative; z-index: 1;">
    	<ActionDisplay />
	</div>
</dialog>
