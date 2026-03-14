<script lang="ts">
	import { Info } from "@lucide/svelte";
	import { onMount } from "svelte";

	let {
		message,
		align = 'auto'
	} = $props();

	let tooltipContainer: HTMLDivElement;
	let tooltipAlignment = $state("left");
	let tooltipActive = $state(false);

	function updateAlignment() {
		if (align !== 'auto') {
			tooltipAlignment = align;
			return;
		}
		const rect = tooltipContainer.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const viewportWidth = window.innerWidth;
		tooltipAlignment = centerX < viewportWidth / 2 ? "left" : "right";
	}

	function showTooltip(event: MouseEvent) {
		event.stopPropagation();
		tooltipActive = true;
	}

	function handleClickOutside(event: MouseEvent) {
		if (tooltipContainer && !tooltipContainer.contains(event.target as Node)) {
			tooltipActive = false;
		}
	}

	onMount(() => {
		updateAlignment();
        
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div
	class="relative group inline-block"
	bind:this={tooltipContainer}
	onmouseenter={updateAlignment}
	role="tooltip">
	<!-- Info Icon -->
	<button
		class="text-gray-600 hover:text-gray-800 cursor-pointer select-none"
		onclick={showTooltip}
		type="button">
		<Info id="tooltip-icon"/>
	</button>

	<div
		class="absolute bottom-full {tooltipAlignment}-0 mb-2 min-w-48 max-w-xs break-words px-2 py-1 text-sm text-white bg-gray-800 rounded-md pointer-events-none transition-opacity {tooltipActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}"
		style="width: max-content; max-width: min(300px, 80vw); white-space: normal;">
		{message}
	</div>
</div>
