<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton";
  import SearchBar from "../svelteComponents/SearchBar.svelte";
  import { Link, navigate } from "svelte-routing";
  import MdMenu from "svelte-icons/md/MdMenu.svelte";
  import { onMount } from 'svelte';
  import { setTopBarHeight } from '../stores/topBarStore.js';

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
        <Link to={"/"}>
          <div id="title" class="mx-4 text-2xl font-bold">AssetAtlas</div>
        </Link>
        <div class="mx-4">
          <SearchBar {searchQuery} {onSearch} />
        </div>
      </div>
    </div>
  </AppBar>
</div>
