<script lang="ts">
	import { onMount } from "svelte";
	let {
		dialog = $bindable(),
		isLarge = false,
		close,
		create,
		children,
	}: {
		dialog: HTMLDialogElement | undefined;
		isLarge: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		close: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		create?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	} = $props();

	onMount(() => {
		create?.();
	});

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
</dialog>
