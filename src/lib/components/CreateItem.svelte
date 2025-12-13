<script lang="ts">
	import { browser } from '$app/environment';
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import Device from 'svelte-device-info'

	import "$lib/styles/main.css";
    import CreateItemDesktop from "./CreateItemDesktop.svelte";
    import CreateItemMobile from "./CreateItemMobile.svelte";

    export let dialog: HTMLDialogElement;
	export let item: IBasicItemPopulated | null;
	export let duplicate = false;

	export function changeItem(newItem: IBasicItemPopulated){
		console.log("item changed");
		item = newItem;
		if (duplicate) {
			name = item.name;
			if (item.description) {
				description = item.description;
			}
			tags = item.tags.toString();
			if (item.parentItem?.name != null) {
				parentItemName = item.parentItem?.name;
			}
			if (item.parentItem) {
				parentItemId = item.parentItem._id.toString();
			}
			if (item.homeItem?.name != null) {
				homeItemName = item.homeItem?.name;
			}
			if (item.homeItem) {
				homeItemId = item.homeItem._id.toString();
			}
			if (item.template) {
				templateName = item.template?.name;
				templateId = item.template?._id.toString();
			}
		}
	}

	function handleParentItemInput(event: Event) {
		const target = event.target as HTMLInputElement;
		parentItemName = target.value;
		parentItemId = null;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchParentItems(parentItemName);
		}, 300);
	}

	async function searchParentItems(query: string) {
		try {
			const response = await fetch(
				`/api/items/search?name=${encodeURIComponent(query)}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);
			const data = await response.json();
			parentItemSuggestions = data;
		} catch (err) {
			console.error("Error searching parent items:", err);
		}
	}

	function selectParentItem(item: { name: string; _id: string | null }) {
		parentItemName = item.name;
		parentItemId = item._id;
		parentItemSuggestions = [];
		if (item && item._id) {
			addToRecents("item", item);
		}
	}

	function selectHomeItem(item: { name: string; _id: string | null }) {
		homeItemName = item.name;
		homeItemId = item._id;
		homeItemSuggestions = [];
		if (item && item._id) {
			addToRecents("item", item);
		}
	}

	function selectTemplate(item: { name: string; _id: string }) {
		templateName = item.name;
		templateId = item._id;
		templateSuggestions = [];
		loadTemplateFields(templateId);
		if (item && item._id) {
			addToRecents("template", item);
		}
	}

	async function loadTemplateFields(templateId: string | null) {
		if (!templateId) return;

		try {
			if (!templateName || templateName.trim() === "") {
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
						throw new Error(
							`Failed to fetch field with ID: ${fieldId}`,
						);
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
			customFields = [...templateFields, ...customFields];
			console.log("Updated customFields:", customFields);
		} catch (err) {
			console.error("Error loading template fields:", err);
		}
	}

	//Removes all fields that came from a template
	function removeTemplateFields() {
		customFields = customFields.filter((f) => !f.fromTemplate);
	}

	//Custom fields handlers
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
				const data: ICustomField[] = await response.json();
				customFields[index].suggestions = data;
			} catch (error) {
				console.error("Error searching custom fields:", error);
			}
		}, 300);
	}

	function selectCustomFieldSuggestion(
		index: number,
		suggestion: ICustomField,
	) {
		customFields[index].fieldName = suggestion.fieldName;
		customFields[index].fieldId = suggestion._id;
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
		if (customFields[index].fromTemplate) return;
		customFields = customFields.filter((_, i) => i !== index);
	}

	function handleImageChange(event: CustomEvent) {
		const { selectedImage: newImage } = event.detail;
		selectedImage = newImage;
	}

	async function loadRecentItems(type: string) {
		try {
			const response = await fetch(`/api/recentItems/${type}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			const data = await response.json();
			return data;
		} catch (err) {
			console.error("Error loading recent items:", err);
			return [];
		}
	}

	async function handleParentItemFocus() {
		if (!parentItemName) {
			parentItemSuggestions = await loadRecentItems("item");
		}
	}

	async function handleHomeItemFocus() {
		if (!homeItemName) {
			homeItemSuggestions = await loadRecentItems("item");
		}
	}

	async function handleTemplateFocus() {
		if (!templateName) {
			templateSuggestions = await loadRecentItems("template");
		}
	}

	async function handleCustomFieldFocus(index: number) {
		if (!customFields[index].fieldName) {
			customFields[index].suggestions =
				await loadRecentItems("customField");
		}
	}

	//Home item search handlers
	function handleHomeItemInput(event: Event) {
		const target = event.target as HTMLInputElement;
		homeItemName = target.value;
		homeItemId = null;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchHomeItems(homeItemName);
		}, 300);
	}

	function handleTemplateInput(event: Event) {
		const target = event.target as HTMLInputElement;
		templateName = target.value;
		templateId = null;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchTemplates(templateName);
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
			homeItemSuggestions = data;
		} catch (err) {
			console.error("Error searching home items:", err);
		}
	}

	async function searchTemplates(query: string) {
		try {
			const response = await fetch(
				`/api/templates?name=${encodeURIComponent(query)}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);
			const data = await response.json();
			templateSuggestions = data;

			//Check for an exact match
			const exactMatch = data.find(
				(template: { name: string }) => template.name === templateName,
			);

			if (exactMatch) {
				if (templateId !== exactMatch._id) {
					templateId = exactMatch._id;
					await loadTemplateFields(templateId);
				}
			} else {
				templateId = null;
				removeTemplateFields();
			}
		} catch (err) {
			console.error("Error searching templates:", err);
		}
	}
</script>

{#if browser && Device.isMobile}
	<CreateItemMobile></CreateItemMobile>	
{:else}
	<CreateItemDesktop></CreateItemDesktop>
{/if}




