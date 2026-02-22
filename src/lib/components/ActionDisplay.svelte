<script lang="ts">
	import { actionStore } from '$lib/stores/actionStore.js';
	import toast, { Toaster } from 'svelte-french-toast';
	import { tick } from 'svelte';

	let toasterPopover: HTMLDivElement;

	async function ensureTopLayer() {
		await tick();
		if (toasterPopover && !toasterPopover.matches(':popover-open')) {
			toasterPopover.showPopover();
		}
	}

	function showToast(message: string) {
		ensureTopLayer();
		toast(message, {
			duration: 3000,
			position: 'bottom-center',
			style: `
				background-color: rgba(0, 0, 0, 0.8);
				color: white;
				padding: 1rem;
				border-radius: 0.5rem;
			`
		});
	}

	let previousLength = $state(0);

	$effect(() => {
		const messages = $actionStore;
		if (messages.length > previousLength) {
			const latestMessage = messages[messages.length - 1];
			showToast(latestMessage.text);
		}
		previousLength = messages.length;
	});
</script>

<div
	bind:this={toasterPopover}
	popover="manual"
	class="toaster-popover"
>
	<Toaster position="bottom-center" />
</div>

