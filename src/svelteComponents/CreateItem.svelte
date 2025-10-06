<script lang="ts">
  import "../svelteStyles/main.css";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import { createItemStore } from "../stores/itemInfoStore.js";
  import type { ICustomField } from "../stores/itemInfoStore.js";
  import CreateItemDesktop from "./CreateItemDesktop.svelte";
  import CreateItemMobile from "./CreateItemMobile.svelte";

  export let dialog: HTMLDialogElement;
  export let item: IBasicItemPopulated | null;
  export let duplicate = false;


  let templateDialog: HTMLDialogElement | undefined;
  let isMobile = window.innerWidth < 768;

  window.addEventListener("resize", () => {
    isMobile = window.innerWidth < 768;
  });

  export function changeItem(newItem: IBasicItemPopulated){
    if (duplicate) {
      $createItemStore.name = newItem.name;
      if (newItem.description) {
        $createItemStore.description = newItem.description;
      }
      $createItemStore.tags = newItem.tags.toString();
      if (newItem.parentItem?.name != null) {
      $createItemStore.parentItemName = newItem.parentItem?.name;
      }
      if (newItem.parentItem) {
        $createItemStore.parentItemId = newItem.parentItem._id.toString();
      }
      if (newItem.homeItem?.name != null) {
        $createItemStore.homeItemName = newItem.homeItem?.name;
      }
      if (newItem.homeItem) {
        $createItemStore.homeItemId = newItem.homeItem._id.toString();
      }
      if (newItem.template) {
        $createItemStore.templateName = newItem.template?.name;
        $createItemStore.templateId = newItem.template?._id.toString();
      }
    }
  }

  if (item != null) {
    $createItemStore.homeItemName = item.name;
    $createItemStore.homeItemId = item._id.toString();
    if (duplicate) {
      $createItemStore.name = item.name;
      if (item.description) {
        $createItemStore.description = item.description;
      }
      $createItemStore.tags = item.tags.toString();
      if (item.parentItem?.name != null) {
      $createItemStore.parentItemName = item.parentItem?.name;
      }
      if (item.parentItem) {
        $createItemStore.parentItemId = item.parentItem._id.toString();
      }
      if (item.homeItem?.name != null) {
        $createItemStore.homeItemName = item.homeItem?.name;
      }
      if (item.homeItem) {
        $createItemStore.homeItemId = item.homeItem._id.toString();
      }
      if (item.template) {
        $createItemStore.templateName = item.template?.name;
        $createItemStore.templateId = item.template?._id.toString();
      }
    }
  }

  let showCreateTemplateDialog = false;

  $: if (showCreateTemplateDialog) {
    if (templateDialog) {
      templateDialog.showModal();
    }
  }

  async function addToRecents(type: string, item: any) {
    console.log("DEBUG - addToRecents called with:", { type, item });
    try {
      const body = JSON.stringify({
        type,
        itemId: item._id,
      });
      console.log("DEBUG - Request body:", body);

      const response = await fetch(`/api/recentItems/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to add to recents: ${responseText}`);
      }
    } catch (err) {
      console.error("Error adding to recents:", err);
    }
  }

  function selectParentItem(item: { name: string; _id: string | null }) {
    $createItemStore.parentItemName = item.name;
    $createItemStore.parentItemId = item._id;
    $createItemStore.parentItemSuggestions = [];
    if (item && item._id) {
      addToRecents("items", item);
    }
  }

  function selectHomeItem(item: { name: string; _id: string | null }) {
    $createItemStore.homeItemName = item.name;
    $createItemStore.homeItemId = item._id;
    $createItemStore.homeItemSuggestions = [];
    if (item && item._id) {
      addToRecents("items", item);
    }
  }

  function selectTemplate(item: { name: string; _id: string }) {
    $createItemStore.templateName = item.name;
    $createItemStore.templateId = item._id;
    $createItemStore.templateSuggestions = [];
    loadTemplateFields($createItemStore.templateId);
    if (item && item._id) {
      addToRecents("templates", item);
    }
  }

  async function loadTemplateFields(templateId: string | null) {
    if (!templateId) return;

    try {
      if (!$createItemStore.templateName || $createItemStore.templateName.trim() === "") {
        return;
      }
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch template. Status: ${response.status} - ${response.statusText}`,
        );
        console.error(await response.text());
        return;
      }

      const data = await response.json();
      console.log("Template data:", data);

      if (!data || !data.fields) {
        console.warn("No fields found in template:", data);
        return;
      }

      //Remove existing template fields before loading new ones
      removeTemplateFields();

      //Add the template fields
      console.log(`Fetching details for ${data.fields.length} fields.`);
      const templateFields = await Promise.all(
        data.fields.map(async (field: { _id: string }) => {
          const fieldId = field._id;
          const fieldUrl = `/api/customFields/${fieldId}`;
          console.log(`Fetching field details from: ${fieldUrl}`);

          const fieldRes = await fetch(fieldUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (!fieldRes.ok) {
            console.error(
              `Failed to fetch field. Status: ${fieldRes.status} - ${fieldRes.statusText}`,
            );
            console.error(await fieldRes.text());
            throw new Error(`Failed to fetch field with ID: ${fieldId}`);
          }

          const fieldData: ICustomField = await fieldRes.json();
          console.log("Field data:", fieldData);

          return {
            fieldName: fieldData.fieldName,
            fieldId: fieldData._id,
            dataType: fieldData.dataType,
            value: "",
            suggestions: [],
            isNew: false,
            isSearching: false,
            isExisting: true,
            fromTemplate: true,
          };
        }),
      );

      console.log("Loaded template fields:", templateFields);

      //display template fields before any user-defined fields
      $createItemStore.customFields = [...templateFields, ...$createItemStore.customFields];
      console.log("Updated customFields:", $createItemStore.customFields);
    } catch (err) {
      console.error("Error loading template fields:", err);
    }
  }

  //Removes all fields that came from a template
  function removeTemplateFields() {
    $createItemStore.customFields = $createItemStore.customFields.filter((f) => !f.fromTemplate);
  }

  //Custom fields handlers
  function onCustomFieldNameInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.customFields[index].fieldName = target.value;
    $createItemStore.customFields[index].fieldId = undefined;
    $createItemStore.customFields[index].isNew = true;
    $createItemStore.customFields[index].isExisting = false;
    searchForCustomFields(index);
  }

  function searchForCustomFields(index: number) {
    if ($createItemStore.customFields[index].searchTimeout)
      clearTimeout($createItemStore.customFields[index].searchTimeout);

    $createItemStore.customFields[index].searchTimeout = setTimeout(async () => {
      const query = $createItemStore.customFields[index].fieldName.trim();
      if (query.length === 0) {
        $createItemStore.customFields[index].suggestions = [];
        return;
      }

      try {
        const response = await fetch(
          `/api/customFields/search?fieldName=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data: ICustomField[] = await response.json();
        $createItemStore.customFields[index].suggestions = data;
      } catch (error) {
        console.error("Error searching custom fields:", error);
      }
    }, 300);
  }

  function selectCustomFieldSuggestion(
    index: number,
    suggestion: ICustomField,
  ) {
    $createItemStore.customFields[index].fieldName = suggestion.fieldName;
    $createItemStore.customFields[index].fieldId = suggestion._id;
    $createItemStore.customFields[index].dataType = suggestion.dataType;
    $createItemStore.customFields[index].isNew = false;
    $createItemStore.customFields[index].isExisting = true;
    $createItemStore.customFields[index].suggestions = [];
    if (suggestion && suggestion._id) {
      addToRecents("customFields", suggestion);
    }
  }

  function addCustomFieldLine() {
    $createItemStore.customFields = [
      ...$createItemStore.customFields,
      {
        fieldName: "",
        fieldId: undefined,
        dataType: "string",
        value: "",
        suggestions: [],
        isNew: true,
        isSearching: false,
        isExisting: false,
        fromTemplate: false,
      },
    ];
  }

  function removeCustomField(index: number) {
    // Only allow removing if not from template
    if ($createItemStore.customFields[index].fromTemplate) return;
    $createItemStore.customFields = $createItemStore.customFields.filter((_, i) => i !== index);
  }

  async function handleHomeItemFocus() {
    if (!$createItemStore.homeItemName) {
      $createItemStore.homeItemSuggestions = await loadRecentItems("items");
    }
  }

  async function handleTemplateFocus() {
    if (!$createItemStore.templateName) {
      $createItemStore.templateSuggestions = await loadRecentItems("templates");
    }
  }

  async function handleCustomFieldFocus(index: number) {
    if (!$createItemStore.customFields[index].fieldName) {
      $createItemStore.customFields[index].suggestions = await loadRecentItems("customFields");
    }
  }

  async function handleCustomFieldClick(index: number) {
    if (!$createItemStore.customFields[index].fieldName) {
      $createItemStore.customFields[index].suggestions = await loadRecentItems("customFields");
    }
  }

  //Home item search handlers
  function handleHomeItemInput(event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.homeItemName = target.value;
    $createItemStore.homeItemId = null;
    if ($createItemStore.debounceTimeout) clearTimeout($createItemStore.debounceTimeout);
    $createItemStore.debounceTimeout = setTimeout(() => {
      searchHomeItems($createItemStore.homeItemName);
    }, 300);
  }

  function handleTemplateInput(event: Event) {
    const target = event.target as HTMLInputElement;
    $createItemStore.templateName = target.value;
    $createItemStore.templateId = null;
    if ($createItemStore.debounceTimeout) clearTimeout($createItemStore.debounceTimeout);
    $createItemStore.debounceTimeout = setTimeout(() => {
      searchTemplates($createItemStore.templateName);
    }, 300);
  }

  async function searchHomeItems(query: string) {
    try {
      const response = await fetch(
        `/api/items/search?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      $createItemStore.homeItemSuggestions = data;
    } catch (err) {
      console.error("Error searching home items:", err);
    }
  }

  async function searchTemplates(query: string) {
    try {
      const response = await fetch(
        `/api/templates/searchTemplates?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      $createItemStore.templateSuggestions = data;

      //Check for an exact match
      const exactMatch = data.find(
        (template: { name: string }) => template.name === $createItemStore.templateName,
      );

      if (exactMatch) {
        if ($createItemStore.templateId !== exactMatch._id) {
          $createItemStore.templateId = exactMatch._id;
          await loadTemplateFields($createItemStore.templateId);
        }
      } else {
        $createItemStore.templateId = null;
        removeTemplateFields();
      }
    } catch (err) {
      console.error("Error searching templates:", err);
    }
  }
</script>

{#if isMobile}
  <CreateItemMobile/>
{:else}
  <CreateItemDesktop
    bind:dialog/>
{/if}