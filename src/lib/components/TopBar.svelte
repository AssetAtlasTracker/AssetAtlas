<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton-svelte";
  import { Switch } from "@skeletonlabs/skeleton-svelte";
  import SearchBar from "./SearchBar.svelte";
  import MdMenu from "svelte-icons/md/MdMenu.svelte";
  import { onMount } from 'svelte';
  import { setTopBarHeight } from '../stores/topBarStore.js';
  import { createEventDispatcher } from 'svelte';

  export let searchQuery: string = "";
  export let onSearch: (query: string) => void;
  export let menu: HTMLDialogElement | undefined;

  function handleClickMenu() {
    menu?.click();
  }

  let topBarElement: HTMLDivElement;

  onMount(() => {
    if (topBarElement) {
      const height: number = topBarElement.getBoundingClientRect().height;
      setTopBarHeight(height);
    }

    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        setTopBarHeight(entry.contentRect.height);
      }
    });

    if (topBarElement) {
      resizeObserver.observe(topBarElement);
    }

    return () => {
      if (topBarElement) {
        resizeObserver.unobserve(topBarElement);
      }
    };
  });

  export let exactSearch: boolean;


  interface ChangeEventDetail {
    value: string; 
  }

  const dispatch = createEventDispatcher<{ change: ChangeEventDetail }>();
  function handleChange(event: Event) {
    dispatch('change', { value: "change" });
  }
</script>

<div bind:this={topBarElement} class="top-bar-wrapper">
  <AppBar class="top-bar border glass">
    <div class="top-bar-flex">
      <button class="mx-4" on:click={handleClickMenu}>
        <div class="icon-small">
          <MdMenu />
        </div>
      </button>
      <div class="flex-1 m-4">
        <a href={"/"}>
          <div id="title" class="mx-4 text-2xl font-bold">AssetAtlas</div>
        </a>
        <div class="mx-4">
          <SearchBar {searchQuery} {onSearch} />
        </div>
      </div>
       <div class="sort-flex"></div>
    <!-- <SlideToggle
      name="exactToggle"
      active="toggle-background"
      bind:checked={exactSearch}
      on:change={handleChange}
      >Exact Search</SlideToggle
    > -->
    </div>
  </AppBar>
</div>
