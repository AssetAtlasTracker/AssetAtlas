<script lang="ts">
  import { onMount } from 'svelte';
  import { bringToFront } from '../stores/zIndexStore.js';
  
  export let initialX = 0;
  export let initialY = 0;
  export let windowTitle = "";
  export let windowClass = "";

  let container: HTMLElement;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let currentX = initialX;
  let currentY = initialY;
  let zIndex = 1;
  
  function handleMouseDown(event: MouseEvent) {
    document.body.style.userSelect = "none";
    isDragging = true;

    startX = event.clientX - currentX;
    startY = event.clientY - currentY;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    //Bring window to front when starting to drag
    bringWindowToFront();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    currentX = event.clientX - startX;
    currentY = event.clientY - startY;

    container.style.left = `${currentX}px`;
    container.style.top = `${currentY}px`;
  }

  function handleMouseUp() {
    document.body.style.userSelect = "";
    isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }
  
  function bringWindowToFront() {
    zIndex = bringToFront();
    if (container) {
      container.style.zIndex = String(zIndex);
    }
  }

  //Initialize with a starting z-index and set up the window
  onMount(() => {
    bringWindowToFront();
  });
</script>

<div
  bind:this={container}
  class="floating-container glass {windowClass}"
  style="position: absolute; left: {initialX}px; top: {initialY}px;"
  role="dialog"
  aria-labelledby={windowTitle ? "window-title-" + windowTitle.replace(/\s+/g, '-').toLowerCase() : undefined}
>
  <div
    class="window-bar"
    on:mousedown={handleMouseDown}
    on:keydown={(e) => e.key === 'Enter' && handleMouseDown(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }))}
    role="button"
    tabindex="0"
    aria-label="Drag to move window"
  >
    {#if windowTitle}
      <span class="window-title" id="window-title-{windowTitle.replace(/\s+/g, '-').toLowerCase()}">{windowTitle}</span>
    {/if}
  </div>

  <div class="window-content">
    <slot></slot>
  </div>
</div>

<style>
  .floating-container {
    position: absolute;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
  }
  
  .window-bar {
    width: 100%;
    height: 30px;
    background: rgba(0, 0, 0, 0.1);
    cursor: move;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 8px;
    box-sizing: border-box;
    margin: 0;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  .window-bar:hover {
    background: rgba(0, 0, 0, 0.15);
  }
  
  .window-bar:active {
    background: rgba(0, 0, 0, 0.2);
  }
  
  .window-title {
    font-size: 14px;
    font-weight: bold;
    margin-left: 8px;
    pointer-events: none; /* Prevents text selection when dragging */
  }
  
  .window-content {
    padding: 16px;
    overflow-y: auto;
    flex-grow: 1;
    width: 100%;
    box-sizing: border-box;
  }
</style>
