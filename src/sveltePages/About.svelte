<script lang="ts">
  import UserList from "../svelteComponents/UserList.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import Menu from "../svelteComponents/Menu.svelte";
  import ActionDisplay from "../svelteComponents/ActionDisplay.svelte";
  import "../svelteStyles/main.css";

  let menu: HTMLDialogElement;
  let searchQuery = "";
  
  function onSearch(query: string) {
    //maybe some day
  }

  console.log("Users.svelte is loading");
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
          Current Version: 1.0.0
        </p>
        <p class="text-center">
          Past versions can be found <a href="https://github.com/AssetAtlasTracker/AssetAtlas/pkgs/container/assetatlas" style="text-decoration: underline;">here</a>
        </p>
        <br />
        <p class ="text-center important-text">Patch Notes</p>
        <br />
        <p class="text-center">
            - Initial Release of AssetAtlas. Features include item tracking and template creation.
        </p>
      </div>
  </div>
</div>