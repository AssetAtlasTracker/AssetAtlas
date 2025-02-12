<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton";
  import SearchBar from "../svelteComponents/SearchBar.svelte";
  import { Link, navigate } from "svelte-routing";
  import MdMenu from "svelte-icons/md/MdMenu.svelte";

  export let searchQuery: string = "";
  export let onSearch: (query: string) => void;
  export let menu: HTMLDialogElement | undefined;

  function handleClickMenu() {
    menu?.click();
  }
</script>

<AppBar class="top-bar border glass z-10">
  <div class="top-bar-flex">
    <button class="nav-margin" on:click={handleClickMenu}>
      <div style="width: 24px; height: 24px">
        <MdMenu />
      </div>
    </button>
    <div class="flex-1" style="margin: 1rem;">
      <Link to={"/"}>
        <div id="title" class="nav-margin text-2xl font-bold">AssetAtlas</div>
      </Link>
      <div class="nav-margin">
        <SearchBar {searchQuery} {onSearch} />
      </div>
    </div>
  </div>
</AppBar>
