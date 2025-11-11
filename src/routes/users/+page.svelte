<script lang="ts">
  import UserList from "$lib/components/UserList.svelte";
  import TopBar from "$lib/components/TopBar.svelte";
  import Menu from "$lib/components/Menu.svelte";
  import ActionDisplay from "$lib/components/ActionDisplay.svelte";
  import "$lib/styles/main.css";

  let menu: HTMLDialogElement;
  let searchQuery = "";
  
  function onSearch(query: string) {
    //maybe some day
  }

  console.log("Users.svelte is loading");
</script>

<ActionDisplay />

<TopBar searchQuery="" {onSearch} {menu}></TopBar>

<div class="page-with-topbar">
  <Menu bind:menu />
  <UserList />
</div>
