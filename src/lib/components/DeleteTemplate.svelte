<script lang="ts">
	import { actionStore } from '$lib/stores/actionStore.js';
	import { createEventDispatcher } from 'svelte';

	let {
		templateId,
		onDelete = () => {},
		children
	} = $props<{
		templateId: string;
		onDelete: (id: string) => void;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
	}>();

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

<button onclick={deleteTemplate} class="warn-button font-semibold shadow">
	{@render children?.()}
</button>
