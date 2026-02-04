<script lang="ts">
	import { browser } from "$app/environment";
	import { dragDropMode } from "$lib/stores/dragDropStore.js";
	import { topBarHeight } from "$lib/stores/topBarStore.js";
	import { bringToFront } from "$lib/stores/zIndexStore.js";
	import {
		ExternalLinkIcon,
		FoldVerticalIcon,
		UnfoldVerticalIcon,
	} from "lucide-svelte";
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

		if (browser) {
			window.addEventListener("pointermove", handlePointerMove);
			window.addEventListener("pointerup", handlePointerUp);

			//backup
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);

			document.addEventListener("mouseleave", handleMouseUp);
			document.addEventListener("pointercancel", handlePointerUp);
		}

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
		if (browser) {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("mouseleave", handleMouseUp);
			document.removeEventListener("pointercancel", handlePointerUp);
		}
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
				if (browser && !window.navigator.userActivation?.hasBeenActive) {
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
		if (browser) {
			window.removeEventListener("keydown", handleKeyDown);
		}
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
							<FoldVerticalIcon />
						{/if}
						{#if isCollapsed}
							<UnfoldVerticalIcon />
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
						<ExternalLinkIcon />
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