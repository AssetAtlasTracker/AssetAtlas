<script lang="ts">
	export let message = "";

	let tooltipContainer: HTMLDivElement;
	let tooltipAlignment = "left";

	function updateAlignment() {
		const rect = tooltipContainer.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const viewportWidth = window.innerWidth;
		tooltipAlignment = centerX < viewportWidth / 2 ? "left" : "right";
	}
</script>

<div
	class="relative group inline-block"
	bind:this={tooltipContainer}
	onmouseenter={updateAlignment}
	role="tooltip">
	<!-- Info Icon -->
	<span
		class="text-gray-600 hover:text-gray-800 cursor-pointer select-none"
		aria-label="info">
		🛈
	</span>

	<div
		class="absolute bottom-full {tooltipAlignment}-0 mb-2 w-max max-w-xs px-2 py-1 text-sm text-white bg-gray-800 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
		{message}
	</div>
</div>
