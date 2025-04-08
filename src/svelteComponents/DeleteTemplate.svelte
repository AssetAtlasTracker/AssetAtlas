<script lang="ts">
    export let templateId: string;
    export let onDelete: (id: string) => void;
  
    async function deleteTemplate() {
      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'DELETE',
        });
  
        if (response.ok) {
          onDelete(templateId);
          location.reload();
        } else {
          console.error("Failed to delete template:", await response.text());
        }
      } catch (error) {
        console.error("Error deleting template:", error);
      }
    }
  </script>
  
  <button on:click={deleteTemplate} class="warn-button font-semibold shadow">
    <slot></slot>
  </button>