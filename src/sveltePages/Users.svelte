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

<div class="page-with-topbar">
  <Menu bind:menu />
  <UserList />
</div>
