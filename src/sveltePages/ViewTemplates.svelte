<script lang="ts">
    import TemplateList from "../svelteComponents/TemplateList.svelte";
    import TopBar from "../svelteComponents/TopBar.svelte";
    import type { ITemplate } from "../models/template";

    import "../svelteStyles/main.css";
  
    let templates: ITemplate[] = [];
  
    async function fetchTemplates() {
      try {
        console.log("Fetching templates from:", `/api/templates/getTemplates`);
  
        const response = await fetch(`/api/templates/getTemplates`);
  
        if (!response.ok) {
          throw new Error(
            `Failed to fetch templates: ${response.status} ${response.statusText}`,
          );
        }
  
        const data: ITemplate[] = await response.json();
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
  
  <div class="page-component glass">
    <TemplateList {templates} />
  </div>