<script lang="ts">
  import TopBar from "$lib/components/TopBar.svelte";
  import Menu from "$lib/components/Menu.svelte";
  import ActionDisplay from "$lib/components/ActionDisplay.svelte";
  import "$lib/styles/main.css";

  let menu: HTMLDialogElement;
  const version = import.meta.env.VITE_APP_VERSION || 'dev version';

  function onSearch(query: string) {}
</script>

<ActionDisplay />

<TopBar searchQuery={""} {onSearch} {menu}></TopBar>

<div class="view-layout page-with-topbar">
  <Menu bind:menu />
  <div class = "simple-flex items-center">
    <div id="home-component" class="page-component glass" style="width: 100vw;">
        <p class="text-center important-text">Welcome to AssetAtlas</p>
        <br />
        <p class="text-center">
          AssetAtlas is a self hosted asset management tool designed to help you organize your belongings.
        </p>
        <p class="text-center">
          Current Version: {version}
        </p>
        <p class="text-center">
          Past versions can be found <a href="https://github.com/AssetAtlasTracker/AssetAtlas/pkgs/container/assetatlas" style="text-decoration: underline;">here</a>
        </p>
        <br />
        <p class ="text-center important-text">Report a Bug or Request a Feature</p>
        <br />
        <p class="text-center">
            If you wish to report a bug or request a feature you can follow 
            <a href = "https://github.com/AssetAtlasTracker/AssetAtlas/issues" style="text-decoration: underline">this</a> link.
        </p>
      </div>
  </div>
</div>