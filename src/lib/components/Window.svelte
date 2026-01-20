<script lang="ts">
	import { browser } from "$app/environment";
	import { dragDropMode } from "$lib/stores/dragDropStore.js";
	import { topBarHeight } from "$lib/stores/topBarStore.js";
	import { bringToFront } from "$lib/stores/zIndexStore.js";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";

	export let initialX = 0;
	export let initialY = 0;
	export let windowTitle = "";
	export let windowClass = "";
	export let showClose = false;
	export let showOpenInNewTab = false;
	export let showCollapse = false;

	const dispatch = createEventDispatcher();

	let container: HTMLElement;
	let windowBar: HTMLElement;
	let startX = 0;
	let startY = 0;
	let isDragging = false;
	let currentX = initialX;
	let currentY = initialY;
	let zIndex = 1;
	let currentTopBarHeight: number;
	let currentDragDropMode: boolean;
	let isCollapsed: boolean = false;

	const topBarUnsubscribe = topBarHeight.subscribe((value) => {
		currentTopBarHeight = value;
	});

	const dragDropUnsubscribe = dragDropMode.subscribe((value) => {
		currentDragDropMode = value;
	});

	function handleMouseDown(event: MouseEvent) {
		//check if the click is on a control button
		if ((event.target as HTMLElement).closest(".window-control-button")) {
			return;
		}

		//prevent default browser drag behavior
		event.preventDefault();

		if (windowBar && "pointerId" in event) {
			windowBar.setPointerCapture((event as PointerEvent).pointerId);
		}

		document.body.style.userSelect = "none";
		if (container) {
			container.style.userSelect = "none";
		}

		isDragging = true;

		startX = event.clientX - currentX;
		startY = event.clientY - currentY;

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		//backup
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		document.addEventListener("mouseleave", handleMouseUp);
		document.addEventListener("pointercancel", handlePointerUp);

		bringWindowToFront();
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) return;
		handleMove(event);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		handleMove(event);
	}

	function handleMove(event: MouseEvent | PointerEvent) {
		event.preventDefault();
		currentX = event.clientX - startX;

		const minY = currentTopBarHeight || 0;
		const calculatedY = event.clientY - startY;
		currentY = calculatedY >= minY ? calculatedY : minY;

		container.style.left = `${currentX}px`;
		container.style.top = `${currentY}px`;
	}

	function handlePointerUp(event: PointerEvent) {
		if (windowBar && event.pointerId) {
			try {
				windowBar.releasePointerCapture(event.pointerId);
			} catch (e) {}
		}
		handleEnd(event);
	}

	function handleMouseUp(event?: MouseEvent) {
		handleEnd(event);
	}

	function handleEnd(event?: MouseEvent | PointerEvent) {
		if (event) {
			event.preventDefault();
		}

		if (!isDragging) return;

		document.body.style.userSelect = "";
		if (container) {
			container.style.userSelect = "";
		}

		isDragging = false;

		// Remove all event listeners we added
		window.removeEventListener("pointermove", handlePointerMove);
		window.removeEventListener("pointerup", handlePointerUp);
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", handleMouseUp);
		document.removeEventListener("mouseleave", handleMouseUp);
		document.removeEventListener("pointercancel", handlePointerUp);
	}

	function bringWindowToFront() {
		zIndex = bringToFront();
		if (container) {
			container.style.zIndex = String(zIndex);
			container.focus();
		}
	}

	function closeWindow() {
		dispatch("close");
	}

	function openInNewTab() {
		dispatch("openNewTab");
	}

	function toggleCollapsed() {
		isCollapsed = !isCollapsed;

		const windowContent = container?.querySelector(".window-content");
		if (windowContent) {
			(windowContent as HTMLElement).hidden = isCollapsed;
		}

		bringWindowToFront();
  }
  
	function handleKeyDown(event: KeyboardEvent) {
		if (
			event.key === "Escape" &&
			container &&
			document.activeElement === container
		) {
			closeWindow();
		}
	}

	//Initialize with a starting z-index and set up the window
	onMount(() => {
		bringWindowToFront();

		if (currentTopBarHeight && initialY < currentTopBarHeight) {
			currentY = currentTopBarHeight;
			if (container) {
				container.style.top = `${currentY}px`;
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		const safetyInterval = setInterval(() => {
			if (isDragging) {
				if (
					typeof window !== "undefined" &&
					!window.navigator.userActivation?.hasBeenActive
				) {
					handleEnd();
				}
			}
		}, 500);

		return () => {
			clearInterval(safetyInterval);
			if (isDragging) {
				handleEnd();
			}
		};
	});

	onDestroy(() => {
		topBarUnsubscribe();
		dragDropUnsubscribe();
		window.removeEventListener("keydown", handleKeyDown);
		if (isDragging) {
			handleEnd();
		}
	});
</script>

{#if browser}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
	<div
		bind:this={container}
		class="floating-container glass {windowClass} {isDragging
			? 'no-select'
			: ''}"
		style="position: absolute; left: {initialX}px; top: {initialY}px;"
		role="dialog"
		tabindex="0"
		aria-labelledby={windowTitle
			? "window-title-" + windowTitle.replace(/\s+/g, "-").toLowerCase()
			: undefined}
		on:mousedown={() => bringWindowToFront()}>
		<!-- TODO: Get rid of style= -->
		<div
			bind:this={windowBar}
			class="window-bar"
			on:pointerdown={handleMouseDown}
			on:mousedown={handleMouseDown}
			on:keydown={(e) =>
				e.key === "Enter" &&
					handleMouseDown(
						new MouseEvent("mousedown", { clientX: 0, clientY: 0 }),
					)}
			role="button"
			tabindex="0"
			aria-label="Drag to move window"
			style="touch-action: none;">
			{#if windowTitle}
				<span
					class="window-title"
					id="window-title-{windowTitle
						.replace(/\s+/g, '-')
						.toLowerCase()}">{windowTitle}</span>
			{/if}

			<div class="window-controls">
				{#if showCollapse}
					<button
						class="window-control-button collapse-button"
						on:click|stopPropagation={toggleCollapsed}
						on:mousedown|stopPropagation
						on:pointerdown|stopPropagation
						title="{isCollapsed
							? 'Expand'
							: 'Collapse'} this window">
						{#if !isCollapsed}
							<svg
								viewBox="0 0 14 14"
								width="14"
								height="14"
								xmlns="http://www.w3.org/2000/svg"
								><g style="fill:#e2e2e2;fill-opacity:1"
									><path
										class="st0"
										d="M36.6 256c0-10.1 8.2-18.3 18.3-18.3h402.3c10.1 0 18.3 8.2 18.3 18.3s-8.2 18.3-18.3 18.3H54.9c-10.1 0-18.3-8.2-18.3-18.3M256 0c10.1 0 18.3 8.2 18.3 18.3v164.6c0 10.1-8.2 18.3-18.3 18.3s-18.3-8.2-18.3-18.3V18.3C237.7 8.2 245.9 0 256 0"
										style="fill:#e2e2e2;fill-opacity:1"
										transform="matrix(0 .0319 -.02734 0 14 -1.167)" /><path
										class="st0"
										d="M342.1 96.8c7.1 7.1 7.2 18.7 0 25.9L269 195.8c-7.1 7.1-18.7 7.2-25.9 0L170 122.7c-7.1-7.2-7.1-18.7 0-25.9 7.2-7.1 18.7-7.1 25.9 0L256 157l60.2-60.2c7.1-7.2 18.7-7.2 25.9 0M256 512c10.1 0 18.3-8.2 18.3-18.3V329.1c0-10.1-8.2-18.3-18.3-18.3s-18.3 8.2-18.3 18.3v164.6c0 10.1 8.2 18.3 18.3 18.3"
										style="fill:#e2e2e2;fill-opacity:1"
										transform="matrix(0 .0319 -.02734 0 14 -1.167)" /><path
										class="st0"
										d="M342.1 415.2c7.1-7.1 7.2-18.7 0-25.9L269 316.2c-7.1-7.1-18.7-7.2-25.9 0L170 389.3c-7.1 7.2-7.1 18.7 0 25.9 7.2 7.1 18.7 7.1 25.9 0L256 355l60.2 60.2c7.1 7.2 18.7 7.2 25.9 0"
										style="fill:#e2e2e2;fill-opacity:1"
										transform="matrix(0 .0319 -.02734 0 14 -1.167)" /></g
								></svg>
						{/if}
						{#if isCollapsed}
							<svg
								viewBox="0 0 14 14"
								width="14"
								height="14"
								xmlns="http://www.w3.org/2000/svg"
								><g style="fill:#e2e2e2;fill-opacity:1"
									><path
										class="st0"
										d="M36.6 256c0-10.1 8.2-18.3 18.3-18.3h402.2c10.1 0 18.3 8.2 18.3 18.3s-8.2 18.3-18.3 18.3H54.9c-10.1 0-18.3-8.2-18.3-18.3M256 201.2c10.1 0 18.3-8.2 18.3-18.3V18.3C274.3 8.2 266.1 0 256 0s-18.3 8.2-18.3 18.3v164.5c0 10.2 8.2 18.4 18.3 18.4"
										style="fill:#e2e2e2;fill-opacity:1"
										transform="matrix(0 .0319 -.02735 0 14 -1.168)" /><path
										class="st0"
										d="M342.1 104.4c7.1-7.1 7.2-18.7 0-25.9L269 5.4c-7.1-7.1-18.7-7.2-25.9 0L170 78.5c-7.1 7.2-7.1 18.7 0 25.9 7.2 7.1 18.7 7.1 25.9 0L256 44.2l60.2 60.2c7.1 7.1 18.7 7.2 25.9 0M256 310.8c10.1 0 18.3 8.2 18.3 18.3v164.5c0 10.1-8.2 18.3-18.3 18.3s-18.3-8.2-18.3-18.3V329.1c0-10.1 8.2-18.3 18.3-18.3"
										style="fill:#e2e2e2;fill-opacity:1"
										transform="matrix(0 .0319 -.02735 0 14 -1.168)" /><path
										class="st0"
										d="M342.1 407.6c7.1 7.1 7.2 18.7 0 25.9L269 506.6c-7.1 7.1-18.7 7.2-25.9 0L170 433.5c-7.1-7.2-7.1-18.7 0-25.9 7.2-7.1 18.7-7.1 25.9 0l60.2 60.2 60.2-60.2c7-7.1 18.6-7.2 25.8 0"
										style="fill:#e2e2e2;fill-opacity:1"
										transform="matrix(0 .0319 -.02735 0 14 -1.168)" /></g
								></svg>
						{/if}
					</button>
				{/if}

				{#if showOpenInNewTab}
					<button
						class="window-control-button external-link-button"
						on:click|stopPropagation={openInNewTab}
						on:mousedown|stopPropagation
						on:pointerdown|stopPropagation
						title="Open this window in a new tab">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg">
							<path
								d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round" />
							<path
								d="M15 3H21V9"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round" />
							<path
								d="M10 14L21 3"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round" />
						</svg>
					</button>
				{/if}

				{#if showClose}
					<button
						class="window-control-button x-button"
						on:click|stopPropagation={closeWindow}
						on:mousedown|stopPropagation
						on:pointerdown|stopPropagation
						title="Close this window">
						X
					</button>
				{/if}
			</div>
		</div>

		<div class="window-content">
			<slot></slot>
		</div>
	</div>
{/if}
