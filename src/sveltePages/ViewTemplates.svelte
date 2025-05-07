<script lang="ts">
  import TemplateList from "../svelteComponents/TemplateList.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import Menu from "../svelteComponents/Menu.svelte";
  import type { ITemplatePopulated } from "../models/template.js";
  import DeleteTemplate from "../svelteComponents/DeleteTemplate.svelte";
  import { onMount } from "svelte";

  import "../svelteStyles/main.css";
  import CreateTemplate from "../svelteComponents/CreateTemplate.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";

  let templates: ITemplatePopulated[] = [];
  let menu: HTMLDialogElement;
  let templateDialog: HTMLDialogElement | undefined;

  async function fetchTemplates() {
    try {
      console.log("Fetching templates from:", `/api/templates/getTemplates`);

      const response = await fetch(`/api/templates/getTemplates`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch templates: ${response.status} ${response.statusText}`,
        );
      }

      const data: ITemplatePopulated[] = await response.json();
      templates = data;
      console.log("Fetched templates data:", templates);
    } catch (err) {
      console.error("Error fetching templates:", err);
      templates = [];
    }
  }

  let showCreateTemplateDialog = false;

  $: if (showCreateTemplateDialog && templateDialog) {
    templateDialog.showModal();
  }

  function closeCreateDialog() {
    showCreateTemplateDialog = false;
    templateDialog?.close();
  }

  function handleTemplateCreated() {
    closeCreateDialog();
    fetchTemplates();
  }

  fetchTemplates();

  function onSearch(query: string) {}

  function handleTemplateDeleted() {
    fetchTemplates();
  }

  onMount(() => {
    fetchTemplates();
  });
</script>

<TopBar searchQuery={""} {onSearch} {menu}></TopBar>

<div class="page-with-topbar">
  <Menu bind:menu />
  <TemplateList {templates} />

  <button
    class="add-button text-icon font-bold shadow"
    on:click={() => {
      showCreateTemplateDialog = true;
    }}
  >
    +
  </button>
  {#if showCreateTemplateDialog}
    <Dialog
      bind:dialog={templateDialog}
      on:close={closeCreateDialog}
    >
      <CreateTemplate
        on:templateCreated={handleTemplateCreated}
        on:close={closeCreateDialog}
      />
    </Dialog>
  {/if}
</div>
