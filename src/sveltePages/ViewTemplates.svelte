<script lang="ts">
  import TemplateList from "../svelteComponents/TemplateList.svelte";
  import TopBar from "../svelteComponents/TopBar.svelte";
  import type { ITemplatePopulated } from "../models/template";

  import "../svelteStyles/main.css";

  let templates: ITemplatePopulated[] = [];

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

  fetchTemplates();
</script>

<TopBar searchQuery={""}></TopBar>

<TemplateList {templates} />