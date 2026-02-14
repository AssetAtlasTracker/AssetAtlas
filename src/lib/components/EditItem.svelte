<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { actionStore } from "$lib/stores/actionStore.js";
	import type { ICustomField, ICustomFieldEntryInstance } from "$lib/types/customField";
	import { uploadImage } from '$lib/utility/imageUpload.js';
	import { addToRecents } from "$lib/utility/recentItemHelper";
	import { Switch } from "@skeletonlabs/skeleton-svelte";
	import { createEventDispatcher, onMount } from "svelte";
	import CreateTemplate from "./CreateTemplate.svelte";
	import CustomFieldPicker from "./CustomFieldPicker.svelte";
	import Dialog from "./Dialog.svelte";
	import ImageSelector from "./ImageSelector.svelte";
	import InfoToolTip from "./InfoToolTip.svelte";

	let { item } = $props<{
		item: IBasicItemPopulated;
	}>();

	let templateDialog = $state<HTMLDialogElement | undefined>(undefined);

	let name = $state("");
	let description = $state("");
	let tags = $state("");
	let parentItemName = $state("");
	let parentItemId = $state<string | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let parentItemSuggestions = $state<any[]>([]);
	let homeItemName = $state("");
	let homeItemId = $state<string | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let homeItemSuggestions = $state<any[]>([]);
	let templateName = $state("");
	let templateId = $state<string | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let templateSuggestions = $state<any[]>([]);
	let selectedImage = $state<File | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let imagePreview = $state<string | null>(null);
	let debounceTimeout: NodeJS.Timeout | undefined;
	let removeExistingImage = $state(false);
	let sameLocations = $state(false);

	let fieldItemName = $state("");
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let fieldItemId = $state<string | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let fieldItemSuggestions = $state<any[]>([]);
	let placeholder = $state("Search for item...");

	let customFields = $state<ICustomFieldEntryInstance[]>([]);
	let showEditTemplateDialog = $state(false);

	const dispatch = createEventDispatcher();

	function buildCustomFields(
		currentItem: IBasicItemPopulated,
	): ICustomFieldEntryInstance[] {
		let fields: ICustomFieldEntryInstance[] = [];
		if (currentItem.customFields?.length) {
			//First load non-template fields
			const nonTemplateFields = currentItem.customFields.map((cf) => ({
				fieldName: cf.field.fieldName,
				fieldId: cf.field._id as unknown as string,
				dataType: cf.field.dataType,
				value: cf.value as string,
				suggestions: [],
				isNew: false,
				isSearching: false,
				isExisting: true,
				fromTemplate: false,
			}));

			if (currentItem.template && currentItem.template.fields?.length) {
				const templateFieldIds = new Set(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					currentItem.template.fields.map((tid: any) =>
						typeof tid === "string" ? tid : tid._id.toString(),
					),
				);

				//Split fields into template and non-template
				const templateFields = nonTemplateFields
					.filter(
						(field) =>
							field.fieldId &&
								templateFieldIds.has(field.fieldId.toString()),
					)
					.map((field) => ({ ...field, fromTemplate: true }));

				const remainingFields = nonTemplateFields.filter(
					(field) =>
						!field.fieldId ||
							!templateFieldIds.has(field.fieldId.toString()),
				);

				//Combine with template fields first
				fields = [...templateFields, ...remainingFields];
			} else {
				fields = nonTemplateFields;
			}
		}

		if (currentItem.template && currentItem.template.fields?.length) {
			const templateFieldIds = new Set(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				currentItem.template.fields.map((tid: any) =>
					typeof tid === "string" ? tid : tid._id.toString(),
				),
			);

			fields = fields.map((field) => ({
				...field,
				fromTemplate: field.fieldId
					? templateFieldIds.has(field.fieldId.toString())
					: false,
			}));
		}

		return fields;
	}

	function updateFromItem(currentItem: IBasicItemPopulated) {
		name = currentItem.name;
		description = currentItem.description ?? "";
		tags = currentItem.tags.toString();
		parentItemName = currentItem.parentItem?.name ?? "";
		parentItemId = currentItem.parentItem
			? currentItem.parentItem._id.toString()
			: null;
		parentItemSuggestions = [];
		homeItemName = currentItem.homeItem?.name ?? "";
		homeItemId = currentItem.homeItem
			? currentItem.homeItem._id.toString()
			: null;
		homeItemSuggestions = [];
		templateName = currentItem.template?.name ?? "";
		templateId = currentItem.template
			? currentItem.template?._id.toString()
			: null;
		templateSuggestions = [];
		fieldItemName = "";
		fieldItemId = null;
		fieldItemSuggestions = [];
		placeholder = "Search for item...";
		customFields = buildCustomFields(currentItem);
		selectedImage = null;
		imagePreview = currentItem.image
			? `/api/items/${currentItem._id}/image`
			: null;
		removeExistingImage = false;
		sameLocations = false;

		if (currentItem.image) {
			void getImage();
		}
	}

	$effect(() => {
		updateFromItem(item);
		void loadItemDisplayNames();
	});

	$effect(() => {
		if (showEditTemplateDialog && templateDialog) {
			templateDialog.showModal();
		}
	});

	async function getImage() {
		try {
			const response = await fetch(`/api/items/${item._id}/image`);
			if (!response.ok) throw new Error("Failed to fetch image");
			const blob = await response.blob();
			imagePreview = URL.createObjectURL(blob);
		} catch (err) {
			console.error("Error fetching image:", err);
		}
	}

	async function createCustomField(
		fieldName: string,
		dataType: string,
	): Promise<ICustomField> {
		const response = await fetch(`/api/customFields`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fieldName, dataType }),
		});
		return await response.json();
	}

	//Parent item search handlers
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
		if (item._id) addToRecents("item", item);
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

	function selectHomeItem(item: { name: string; _id: string | null }) {
		homeItemName = item.name;
		homeItemId = item._id;
		homeItemSuggestions = [];
		if (item._id) addToRecents("item", item);
	}

	function handleTemplateInput(event: Event) {
		const target = event.target as HTMLInputElement;
		templateName = target.value.trim();
		//Clear templateId since user is typing something else now
		templateId = null;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchTemplates(templateName);
		}, 300);
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

	function selectTemplate(item: { name: string; _id: string }) {
		templateName = item.name;
		templateId = item._id;
		templateSuggestions = [];
		loadTemplateFields(templateId);
		addToRecents("template", item);
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

			//template fields first, then other fields
			const nonTemplateFields = customFields.filter(
				(f) => !f.fromTemplate,
			);
			customFields = [...templateFields, ...nonTemplateFields];
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
		addToRecents("customField", suggestion);
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
		const { selectedImage: newImage, removeExistingImage: remove } =
			event.detail;
		selectedImage = newImage;
		removeExistingImage = remove;
	}

	async function searchFieldItems(query: string) {
		try {
			const response = await fetch(
				`/api/items/search?name=${encodeURIComponent(query)}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);
			const data = await response.json();
			fieldItemSuggestions = data;
		} catch (err) {
			console.error("Error searching field items:", err);
		}
	}

	function handleFieldItemInput(event: Event) {
		const target = event.target as HTMLInputElement;
		fieldItemName = target.value;
		fieldItemId = null;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchFieldItems(fieldItemName);
		}, 300);
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

	export async function handleFieldItemFocus() {
		if (!fieldItemName) {
			fieldItemSuggestions = await loadRecentItems("item");
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

	async function checkImageExists() {
		if (!item?._id) return;

		try {
			const response = await fetch(`/api/items/${item._id}/image`);
			if (response.ok) {
				const timestamp = Date.now();
				imagePreview = `/api/items/${item._id}/image?t=${timestamp}`;
				removeExistingImage = false;
			} else {
				imagePreview = null;
				removeExistingImage = true;
			}
		} catch (err) {
			console.error("Error checking image:", err);
			imagePreview = null;
			removeExistingImage = true;
		}
	}

	onMount(() => {
		if (item?._id && item.image) {
			checkImageExists();
		}
	});

	async function checkIfItemExists(itemName: string) {
		if(itemName.trim() === "") return false;
		try {
			const response = await fetch(
				`/api/customFields/checkItemName?itemName=${encodeURIComponent(itemName)}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);
			const data = await response.json();
			return data.id;
		} catch (err) {
			console.error("Error checking item name:", err);
			return false;
		}
			
	}

	async function checkIfItemExistsById(itemId: string) {
		if(itemId === "") return false;
		try {
			const response = await fetch(
				`/api/customFields/checkItemId?itemID=${itemId}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);
			const data = await response.json();
			return data.name;
		} catch (err) {
			console.error("Error checking item name:", err);
			return false;
		}
			
	}

	async function loadItemDisplayNames() {
		for (let i = 0; i < customFields.length; i++) {
			const field = customFields[i];
			if (field.dataType === 'item' && field.value && field.value !== '') {

				const itemId = String(field.value);
			
				const itemName = await checkIfItemExistsById(itemId);
				if (itemName) {
					customFields[i].displayValue = itemName;
				}
			}
		}
	}

	export async function handleEditItem() {
		try {
			const formData = new FormData();
			formData.append("name", name);
			formData.append("description", description || "");
			formData.append(
				"tags",
				JSON.stringify(tags.split(",").map((t) => t.trim())),
			);
			if (homeItemId) {
				formData.append("homeItem", homeItemId);
				if (sameLocations) {
					formData.append("parentItem", homeItemId);
				}
			}

			if (parentItemId && !sameLocations)
				formData.append("parentItem", parentItemId);

			if (templateId) formData.append("template", templateId);

			// Add custom fields
			const formattedFields = await Promise.all(
				customFields.map(async (field) => {
					if (!field.isNew && field.fieldId) {
						return { field: field.fieldId, value: field.value };
					} else {
						const createdField = await createCustomField(
							field.fieldName,
							field.dataType,
						);
						return { field: createdField._id, value: field.value };
					}
				}),
			);
			formData.append("customFields", JSON.stringify(formattedFields));

			// Handle image
			if (removeExistingImage) {
				formData.append("removeImage", "true");
			} else if (selectedImage) {
				const filename = await uploadImage(selectedImage);
				formData.append("image", filename);
			}

			const response = await fetch(`/api/items/${item._id}`, {
				method: "PATCH",
				body: formData,
			});

			const data = await response.json();
			if (!response.ok)
				throw new Error(data.message || "Failed to update item");

			// Notify parent and close dialog
			dispatch("close");
			actionStore.addMessage("Item updated successfully");
			dispatch("itemUpdated");
		} catch (err) {
			console.error("Error updating item:", err);
			actionStore.addMessage("Error updating item");
		}
	}
</script>

<div class="page-component">
	<form onsubmit={
		(event) => {
			event.preventDefault();
			handleEditItem();
		}
	}>
		<div class="flex flex-col space-y-4">
			<div class="flex space-x-4">
				<!-- Name -->
				<label class="flex-column flex-grow">
					Name (required):
					<input
						class="dark-textarea py-2 px-4 w-full"
						type="text"
						bind:value={name}
						required />
				</label>

				<!-- Tags -->
				<label class="flex-column flex-grow">
					Tags:
					<textarea
						class="dark-textarea py-2 px-4 w-full"
						bind:value={tags}></textarea>
				</label>
			</div>

			<!-- Description -->
			<label class="min-w-[400px]">
				Description:
				<textarea
					rows="5"
					class="dark-textarea py-2 px-4 w-full"
					placeholder={item.description}
					bind:value={description}></textarea>
			</label>

			<ImageSelector
				itemId={item._id.toString()}
				existingImage={!!item.image}
				on:imageChange={handleImageChange} />

			<Switch
				checked={sameLocations}
				onchange={() => {
					sameLocations = !sameLocations;
				}}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>Use same home and current location</Switch.Label>
				<Switch.HiddenInput />
			</Switch>

			<div class="flex space-x-4">
				<!-- Parent Item -->
				{#if !sameLocations}
					<label class="flex-column flex-grow relative">
						<div class="flex items-center gap-2">
							<span>Current Location:</span>
							<InfoToolTip
								message="Where an item currently is, e.g. a shirt's parent item may be a suitcase." />
						</div>
						<input
							type="text"
							class="dark-textarea py-2 px-4 w-full"
							bind:value={parentItemName}
							oninput={handleParentItemInput}
							onfocus={handleParentItemFocus}
							onblur={() => (parentItemSuggestions = [])} />
						{#if parentItemSuggestions.length > 0}
							<ul class="suggestions suggestion-box">
								{#each parentItemSuggestions as item}
									<button
										class="suggestion-item"
										type="button"
										onmousedown={(e) => {
											e.preventDefault();
											selectParentItem(item);
										}}>
										{item.name}
									</button>
								{/each}
							</ul>
						{/if}
					</label>
				{/if}

				<!-- Home Item -->
				<label class="flex-column flex-grow relative">
					<div class="flex items-center gap-2">
						<span>Home Location:</span>
						<InfoToolTip
							message="Where an item should normally be, e.g a shirt's home item may be a drawer." />
					</div>
					<input
						type="text"
						class="dark-textarea py-2 px-4 w-full"
						bind:value={homeItemName}
						oninput={handleHomeItemInput}
						onfocus={handleHomeItemFocus}
						onblur={() => (homeItemSuggestions = [])} />
					{#if homeItemSuggestions.length > 0}
						<ul class="suggestions suggestion-box">
							{#each homeItemSuggestions as item}
								<button
									class="suggestion-item"
									type="button"
									onmousedown={(e) => {
										e.preventDefault();
										selectHomeItem(item);
									}}>
									{item.name}
								</button>
							{/each}
						</ul>
					{/if}
				</label>
			</div>

			<!-- Template Field and Create Template Button -->
			<div class="flex space-x-4 items-center">
				<label class="flex-column flex-grow relative">
					<div class="flex items-center gap-2">
						<span>Template:</span>
						<InfoToolTip
							message="A template is a more narrow category of similar items that share common fields. Select an existing template or create a new one." />
					</div>
					<input
						type="text"
						class="dark-textarea py-2 px-4 w-full"
						bind:value={templateName}
						placeholder={item.template?.name}
						oninput={handleTemplateInput}
						onfocus={handleTemplateFocus}
						onblur={() => (templateSuggestions = [])} />
					{#if templateSuggestions.length > 0}
						<ul class="suggestions suggestion-box">
							{#each templateSuggestions as t}
								<button
									class="suggestion-item"
									type="button"
									onmousedown={(e) => {
										e.preventDefault();
										selectTemplate(t);
									}}>
									{t.name}
								</button>
							{/each}
						</ul>
					{/if}
				</label>

				<button
					type="button"
					class="border-button font-semibold shadow"
					onclick={() => (showEditTemplateDialog = true)}>
					Create New Template
				</button>
			</div>
		</div>

		<!-- Custom Fields -->
		<h2 class="font-bold text-lg mt-4">Custom Fields</h2>
		<div class="space-y-2">
			{#each customFields as field, index}
				<div class="field-row">
					<CustomFieldPicker
						bind:field={customFields[index]}
						onFieldNameInput={(e) => onCustomFieldNameInput(index, e)}
						onFieldFocus={() => handleCustomFieldFocus(index)}
						onFieldBlur={() => (customFields[index].suggestions = [])}
						placeholder={placeholder}
						onFieldValueInput={(e) => {
							const target = e.target as HTMLInputElement;
							if (field.dataType === 'item') {
								customFields[index].displayValue = target.value;
								customFields[index].value = ''; // Clear the ID when typing
								handleFieldItemInput(e);
							} else {
								customFields[index].value = target.value;
							}
						}}
						onFieldValueFocus={() => {
							if (field.dataType === 'item') {
								handleFieldItemFocus();
							}
						}}
						onFieldValueBlur={() => {
							console.log("Field value blur - clearing suggestions");
							if (field.dataType === 'item') {
								fieldItemSuggestions = [];
								// Only validate if user actually typed something
								if (customFields[index].displayValue && customFields[index].displayValue.trim() !== '') {
									checkIfItemExists(customFields[index].displayValue || '').then((itemId) => {
										if (itemId) {
											customFields[index].value = itemId;
											return true;
										} else {
											// Only clear if user typed something invalid
											customFields[index].value = '';
											customFields[index].displayValue = '';
											placeholder = "Item not found";
											return false;
										}
									});
								}
							}
						}}
						showDeleteButton={!field.fromTemplate}
						onDelete={() => removeCustomField(index)}>
						{#snippet suggestions()}
							{#each field.suggestions as suggestion (suggestion._id)}
								<button
									class="suggestion-item"
									type="button"
									onmousedown={(e) => {
										e.preventDefault();
										selectCustomFieldSuggestion(index, suggestion);
									}}>
									{suggestion.fieldName} ({suggestion.dataType})
								</button>
							{/each}
						{/snippet}
					
						{#snippet itemSuggestions()}
							{#if field.dataType === 'item' && fieldItemSuggestions.length > 0}
								<ul class="suggestions suggestion-box">
									{#each fieldItemSuggestions as item (item._id)}
										<button
											class="suggestion-item"
											type="button"
											onmousedown={(e) => {
												e.preventDefault();
												customFields[index].value = item._id; // Store ID
												customFields[index].displayValue = item.name; // Display name
												fieldItemSuggestions = [];
												addToRecents('item', item);
											}}>
											{item.name}
										</button>
									{/each}
								</ul>
							{/if}
						{/snippet}
					</CustomFieldPicker>
				</div>
			{/each}
		</div>

		<button
			type="button"
			class="border-button font-semibold shadow mt-2"
			onclick={addCustomFieldLine}>
			Add Custom Field
		</button>
		<!-- Submit -->
		<button
			class="success-button font-semibold shadow mt-4 w-full block"
			type="submit">
			Submit Changes
		</button>
	</form>
</div>

{#if showEditTemplateDialog}
	<Dialog
		bind:dialog={templateDialog}
		isLarge={false}
		close={() => {
			showEditTemplateDialog = false;
		}}>
		<CreateTemplate
			on:close={() => {
				showEditTemplateDialog = false;
			}} />
	</Dialog>
{/if}
