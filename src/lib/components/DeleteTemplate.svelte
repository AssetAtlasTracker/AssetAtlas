<script lang="ts">
    import { actionStore } from '$lib/stores/actionStore.js';
    import { createEventDispatcher } from 'svelte';

    export let templateId: string;
    export let onDelete: (id: string) => void = () => {};

    const dispatch = createEventDispatcher();

    async function deleteTemplate() {
      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          actionStore.addMessage('Template deleted successfully!');
          onDelete(templateId);
          dispatch('templateDeleted', { id: templateId });
        } else {
          console.error("Failed to delete template:", await response.text());
          actionStore.addMessage('Error deleting template');
        }
      } catch (error) {
        console.error("Error deleting template:", error);
        actionStore.addMessage('Error deleting template');
      }
    }
  </script>

  <button on:click={deleteTemplate} class="warn-button font-semibold shadow">
    <slot></slot>
  </button>