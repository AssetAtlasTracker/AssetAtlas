<script lang="ts">
	import { browser } from "$app/environment";
	import { topBarHeight } from "$lib/stores/topBarStore.js";
	import { bringToFront } from "$lib/stores/zIndexStore.js";
	import {
		ExternalLinkIcon,
		FoldVerticalIcon,
		UnfoldVerticalIcon,
	} from "lucide-svelte";
	import type { Snippet } from "svelte";
	import { untrack } from "svelte";
	import { createEventDispatcher } from "svelte";

	let {
		children,
		initialX = 0,
		initialY = 0,
		windowTitle = "",
		windowClass = "",
		showClose = false,
		showOpenInNewTab = false,
		showCollapse = false,
	} = $props<{
		children?: Snippet;
		initialX?: number;
		initialY?: number;
		windowTitle?: string;
		windowClass?: string;
		showClose?: boolean;
		showOpenInNewTab?: boolean;
		showCollapse?: boolean;
	}>();

	const dispatch = createEventDispatcher();

	let container = $state<HTMLElement>();
	let windowBar = $state<HTMLElement>();
	let startX = $state(0);
	let startY = $state(0);
	let isDragging = $state(false);
	let currentX = $state(0);
	let currentY = $state(0);
	let zIndex = $state(1);
	let isCollapsed = $state(false);
	let initialized = $state(false);
	let lastInitialX = $state<number | null>(null);
	let lastInitialY = $state<number | null>(null);

	$effect.pre(() => {
		const cx = untrack(() => currentX);
		const cy = untrack(() => currentY);
		console.debug("[Window] position sync effect", {
			initialX,
			initialY,
			currentX: cx,
			currentY: cy
		});
		if (isDragging) return;
		if (lastInitialX === initialX && lastInitialY === initialY) return;
		lastInitialX = initialX;
		lastInitialY = initialY;
		currentX = initialX;
		currentY = initialY;
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

		const minY = $topBarHeight || 0;
		const calculatedY = event.clientY - startY;
		currentY = calculatedY >= minY ? calculatedY : minY;

		if (container) {
			container.style.left = `${currentX}px`;
			container.style.top = `${currentY}px`;
		}
	}

	function handlePointerUp(event: PointerEvent) {
		if (windowBar && event.pointerId) {
			try {
				windowBar.releasePointerCapture(event.pointerId);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (e){}
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

	$effect(() => {
		if (!browser || initialized) return;
		initialized = true;

		bringWindowToFront();
		window.addEventListener("keydown", handleKeyDown);

		const safetyInterval = setInterval(() => {
			if (isDragging) {
				if (!window.navigator.userActivation?.hasBeenActive) {
					handleEnd();
				}
			}
		}, 500);

		return () => {
			clearInterval(safetyInterval);
			window.removeEventListener("keydown", handleKeyDown);
			if (isDragging) {
				handleEnd();
			}
		};
	});

	$effect(() => {
		const cy = untrack(() => currentY);
		if ($topBarHeight && initialY < $topBarHeight) {
			currentY = $topBarHeight;
			if (container) {
				container.style.top = `${currentY}px`;
			}
		}
	});
</script>

{#if browser}
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
		onmousedown={() => bringWindowToFront()}>
		<!-- TODO: Get rid of style= -->
		<div
			bind:this={windowBar}
			class="window-bar"
			onpointerdown={handleMouseDown}
			onmousedown={handleMouseDown}
			onkeydown={(e) =>
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
						onclick={
							(event) => {
								event.stopPropagation();
								toggleCollapsed();
							}
						}
						onmousedown={
							(event) => {
								event.stopPropagation();
							}
						}
						onpointerdown={
							(event) => {
								event.stopPropagation();
							}
						}
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
						onclick={
							(event) => {
								event.stopPropagation();
								openInNewTab();
							}
						}
						onmousedown={
							(event) => {
								event.stopPropagation();
							}
						}
						onpointerdown={
							(event) => {
								event.stopPropagation();
							}
						}
						title="Open this window in a new tab">
						<ExternalLinkIcon />
					</button>
				{/if}

				{#if showClose}
					<button
						class="window-control-button x-button"
						onclick={
							(event) => {
								event.stopPropagation();
								closeWindow();
							}
						}
						onmousedown={
							(event) => {
								event.stopPropagation();
							}
						}
						onpointerdown={
							(event) => {
								event.stopPropagation();
							}
						}
						title="Close this window">
						X
					</button>
				{/if}
			</div>
		</div>

		<div class="window-content">
			{@render children?.()}
		</div>
	</div>
{/if}