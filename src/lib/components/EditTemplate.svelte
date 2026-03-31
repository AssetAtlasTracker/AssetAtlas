<script lang="ts">
	import type { ICustomField } from "$lib/server/db/models/customField.js";
	import type { ITemplatePopulated } from "$lib/server/db/models/template.js";
	import type { ICustomFieldEntry } from "$lib/types/customField";
	import { addToRecents } from "$lib/utility/recentItemHelper";
	import CustomFieldPicker from "./CustomFieldPicker.svelte";

	let {
		template,
		onClose
	} = $props<{
		template: ITemplatePopulated;
		onClose: () => void;
	}>();

	let name = $state("");
	 
	let customFields = $state<ICustomFieldEntry[]>([]);
	let nameError = $state("");
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
	let lastTemplateKey = $state("");

	function updateFromTemplate(currentTemplate: ITemplatePopulated) {
		name = currentTemplate.name;
		customFields = currentTemplate.fields.map((field: ICustomField) => ({
			fieldName: field.fieldName,
			fieldId: field._id as unknown as string | undefined,
			dataType: field.dataType,
			suggestions: [],
			isNew: false,
			isSearching: false,
			isExisting: true,
		}));
		nameError = "";
	}

	$effect(() => {
		const templateKey = `${template?._id ?? ""}|${template?.updatedAt ?? ""}`;
		if (templateKey === lastTemplateKey) return;
		lastTemplateKey = templateKey;
		updateFromTemplate(template);
	});

	async function handleEditTemplate() {
		customFields = customFields.filter(
			(field) =>
				field.fieldName.trim() !== "" && field.dataType.trim() !== "",
		);

		const formattedCustomFields = await Promise.all(
			customFields.map(async (field) => {
				if (!field.isNew && field.fieldId) {
					return field.fieldId;
				} else {
					const createdField = await createCustomField(
						field.fieldName,
						field.dataType,
						template._id.toString(),
					);
					return createdField._id;
				}
			}),
		);

		try {
			const response = await fetch(
				`/api/templates/editTemplate/${template._id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name,
						fields: formattedCustomFields,
					}),
				},
			);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || "Error editing template");
			}

			const data = await response.json();
			console.log("Template edited:", data);
			location.reload();

			onClose();
		} catch (err) {
			console.error("Error editing template:", err);
		}
	}

	async function createCustomField(
		fieldName: string,
		dataType: string,
		templateId: string,
	): Promise<ICustomField> {
		const response = await fetch(`/api/customFields`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fieldName, dataType, templateId }),
		});
		return await response.json();
	}

	function onCustomFieldNameInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		customFields[index].fieldName = target.value;
		customFields[index].fieldId = undefined;
		customFields[index].isNew = true;
		customFields[index].isExisting = false;
		searchForCustomFields(index);
	}

	function searchForCustomFields(index: number) {
		if (customFields[index].searchTimeout)
			clearTimeout(customFields[index].searchTimeout);

		customFields[index].searchTimeout = setTimeout(async () => {
			const query = customFields[index].fieldName.trim();
			if (query.length === 0) {
				customFields[index].suggestions = [];
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
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data: any[] = await response.json();
				customFields[index].suggestions = data;
			} catch (error) {
				console.error("Error searching custom fields:", error);
			}
		}, 300);
	}

	async function loadRecentCustomFields() {
		try {
			const response = await fetch(`/api/recentItems/customField`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			const data = await response.json();
			return data;
		} catch (err) {
			console.error("Error loading recent custom fields:", err);
			return [];
		}
	}

	async function handleCustomFieldFocus(index: number) {
		if (!customFields[index].fieldName) {
			customFields[index].suggestions = await loadRecentCustomFields();
		}
	}

	function selectCustomFieldSuggestion(
		index: number,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		suggestion: any,
	) {
		customFields[index].fieldName = suggestion.fieldName;
		customFields[index].fieldId = suggestion._id as string;
		customFields[index].dataType = suggestion.dataType;
		customFields[index].isNew = false;
		customFields[index].isExisting = true;
		customFields[index].suggestions = [];
		if (suggestion && suggestion._id) {
			addToRecents("customField", suggestion);
		}
	}

	function addCustomFieldLine() {
		customFields = [
			...customFields,
			{
				fieldName: "",
				fieldId: undefined,
				dataType: "string",
				suggestions: [],
				isNew: true,
				isSearching: false,
				isExisting: false,
			},
		];
	}

	function removeCustomField(index: number) {
		customFields = customFields.filter((_, i) => i !== index);
	}

	async function checkNameUniqueness() {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			if (!name.trim()) {
				nameError = "";
				return;
			}

			try {
				const response = await fetch(
					`/api/templates?name=${encodeURIComponent(name)}`,
					{
						method: "GET",
						headers: { "Content-Type": "application/json" },
					},
				);
				const data = await response.json();
				const exactMatch = data.some(
					(template: { name: string }) =>
						template.name === name.trim(),
				);

				nameError = exactMatch ? "Template name already exists" : "";
			} catch (err) {
				console.error("Error checking name uniqueness:", err);
				nameError = "";
			}
		}, 300);
	}
</script>

<div class="template-container">
	<h1 id="underline-header" class="font-bold text-center">Edit Template</h1>
	<form onsubmit={(event) => {
		event.preventDefault();
		handleEditTemplate();
	}}>
		<label class="block mb-4">
			Name:
			<input
				type="text"
				class="dark-textarea py-2 px-4 w-full {nameError
					? 'error'
					: ''}"
				bind:value={name}
				oninput={checkNameUniqueness}
				required />
			{#if nameError}
				<p class="text-red-500 text-sm mt-1">{nameError}</p>
			{/if}
		</label>

		<h3 class="font-bold text-lg mb-4">Custom Fields</h3>
		<div class="space-y-4">
			{#each customFields as field, index}
				<CustomFieldPicker
					bind:field={customFields[index]}
					mode="template"
					onFieldNameInput={(e) => onCustomFieldNameInput(index, e)}
					onFieldFocus={() => handleCustomFieldFocus(index)}
					onFieldBlur={() => (customFields[index].suggestions = [])}
					showDeleteButton={true}
					onDelete={() => removeCustomField(index)}
				>
					{#snippet suggestions()}
						{#each field.suggestions as suggestion}
							<button
								class="suggestion-item"
								type="button"
								onmousedown={(e) => {
									e.preventDefault();
									selectCustomFieldSuggestion(index, suggestion);
								}}
							>
								{suggestion.fieldName} ({suggestion.dataType})
							</button>
						{/each}
					{/snippet}
				</CustomFieldPicker>
			{/each}
		</div>

		<button
			type="button"
			class="border-button font-semibold shadow mt-2"
			onclick={addCustomFieldLine}>
			Add Custom Field
		</button>
		<button
			type="submit"
			class="border-button font-semibold shadow mt-4"
			disabled={!!nameError}>Save</button>
		<button
			type="button"
			class="warn-button font-semibold shadow mt-4 ml-2"
			onclick={onClose}>Cancel</button>
	</form>
</div>
