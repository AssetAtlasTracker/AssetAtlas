<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { bringToFront } from '../stores/zIndexStore.js';
  
  export let initialX = 0;
  export let initialY = 0;
  export let windowTitle = "";
  export let windowClass = "";
  export let showClose = false;
  export let showOpenInNewTab = false;
  
  const dispatch = createEventDispatcher();
  
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

  function closeWindow() {
    dispatch('close');
  }
  
  function openInNewTab() {
    dispatch('openNewTab');
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
    
    <div class="window-controls">
      {#if showOpenInNewTab}
        <button 
          class="window-control-button external-link-button" 
          on:click|stopPropagation={openInNewTab}
          aria-label="Open in new tab"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
      
      {#if showClose}
        <button 
          class="window-control-button close-button" 
          on:click|stopPropagation={closeWindow}
          aria-label="Close window"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>
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
    justify-content: space-between;
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

  .window-controls {
    display: flex;
    align-items: center;
    margin-left: auto;
  }
  
  .window-control-button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    margin-left: 4px;
    padding: 0;
    transition: background-color 0.2s, color 0.2s;
  }
  
  .window-control-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .close-button {
    color: rgba(255, 0, 0, 0.7);
  }
  
  .close-button:hover {
    background-color: rgba(255, 0, 0, 0.2);
    color: rgba(255, 0, 0, 1);
  }
  
  .external-link-button {
    color: rgba(0, 100, 255, 0.7);
  }
  
  .external-link-button:hover {
    background-color: rgba(0, 100, 255, 0.2);
    color: rgba(0, 100, 255, 1);
  }
</style>
