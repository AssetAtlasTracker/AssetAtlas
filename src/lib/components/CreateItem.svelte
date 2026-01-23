<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { actionStore } from "$lib/stores/actionStore.js";
	import { Switch } from "@skeletonlabs/skeleton-svelte";
	import { createEventDispatcher } from "svelte";
	import CreateTemplate from "./CreateTemplate.svelte";
	import CustomFieldPicker from "./CustomFieldPicker.svelte";
	import Dialog from "./Dialog.svelte";
	import ImageSelector from "./ImageSelector.svelte";
	import InfoToolTip from "./InfoToolTip.svelte";

	import "$lib/styles/main.css";

	export let dialog: HTMLDialogElement;

	let templateDialog: HTMLDialogElement | undefined;

	export let item: IBasicItemPopulated | null;
	export let duplicate = false;

	let name = "";
	let description = "";
	let tags = "";
	let parentItemName = "";
	let parentItemId: string | null = null;
	let sameLocations: boolean = true;
	let parentItemSuggestions: any[] = [];
	let homeItemName = "";
	let homeItemId: string | null = null;
	let homeItemSuggestions: any[] = [];
	let fieldItemName = "";
	let fieldItemId: string | null = null;
	let fieldItemSuggestions: any[] = [];
	let templateName = "";
	let templateId: string | null = null;
	let templateSuggestions: any[] = [];
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
	let selectedImage: File | null = null;
	let placeholder: string = "Search for item...";

	const dispatch = createEventDispatcher();

	export function changeItem(newItem: IBasicItemPopulated) {
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

	if (item != null) {
		homeItemName = item.name;
		homeItemId = item._id.toString();
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

	interface ICustomField {
		_id: string;
		fieldName: string;
		dataType: string;
		createdAt: string;
	}

	interface ICustomFieldEntry {
		fieldName: string;
		fieldId?: string;
		dataType: string;
		value: string;
		displayValue?: string;
		suggestions: ICustomField[];
		isNew: boolean;
		isSearching: boolean;
		isExisting: boolean;
		fromTemplate: boolean;
		searchTimeout?: ReturnType<typeof setTimeout>;
	}

	//Start with an empty array by default so no field loads initially
	let customFields: ICustomFieldEntry[] = [];

	let showCreateTemplateDialog = false;

	$: if (showCreateTemplateDialog) {
		if (templateDialog) {
			templateDialog.showModal();
		}
	}

	function resetForm() {
		name = "";
		description = "";
		tags = "";
		parentItemName = "";
		parentItemId = null;
		homeItemName = "";
		homeItemId = null;
		templateName = "";
		templateId = null;
		customFields = [];
		parentItemSuggestions = [];
		homeItemSuggestions = [];
		templateSuggestions = [];
		selectedImage = null;
	}

	async function handleCreateItem() {
		try {
			//If a template name is typed but not an exact match (no templateId set), block creation
			if (templateName.trim() && !templateId) {
				alert(
					"Please select a valid template from the list or clear the field.",
				);
				return;
			}

			const tagsArray = tags.split(",").map((tag) => tag.trim());

			if (sameLocations) {
				parentItemId = homeItemId;
				parentItemName = homeItemName;
			}

			//Filter out empty fields not from the template
			customFields = customFields.filter((field) => {
				if (field.fromTemplate) return true; //Always keep template fields that were loaded
				return (
					field.fieldName.trim() !== "" &&
					field.dataType.trim() !== ""
				);
			});

			const formattedCustomFields = await Promise.all(
				customFields.map(async (field) => {
					if (!field.isNew && field.fieldId) {
						return { field: field.fieldId, value: field.value };
					} else {
						console.log("doing create for field:", field);
						const createdField = await createCustomField(
							field.fieldName,
							field.dataType,
						);
						return { field: createdField._id, value: field.value };
					}
				}),
			);

			console.log("Formatted custom fields:", formattedCustomFields);

			const formData = new FormData();
			formData.append("name", name);
			formData.append("description", description);
			formData.append("tags", JSON.stringify(tagsArray));
			if (parentItemId) formData.append("parentItem", parentItemId);
			if (homeItemId) formData.append("homeItem", homeItemId);
			if (templateId) formData.append("template", templateId);
			formData.append(
				"customFields",
				JSON.stringify(formattedCustomFields),
			);
			if (selectedImage) formData.append("image", selectedImage);

			console.log("Sending request with formData:");
			for (const pair of (formData as any).entries()) {
				console.log(pair[0], pair[1]);
			}

			const response = await fetch(`/api/items`, {
				method: "POST",
				body: formData,
			});

			console.log("Response status:", response.status);
			console.log("Response headers:");
			response.headers.forEach((value, key) => {
				console.log(key, value);
			});

			// Try to get the raw text first
			const rawText = await response.text();
			console.log("Raw response:", rawText);

			// Then parse it as JSON
			const data = JSON.parse(rawText);

			if (!response.ok) {
				actionStore.addMessage("Error creating item");
				throw new Error(data.message || "Error creating item");
			}
			console.log("Item created:", data);
			actionStore.addMessage("Item created successfully!");
			dialog.close();
			dispatch("itemCreated"); //triggers action display stuff

			//Reset the form after successful creation
			resetForm();
		} catch (err) {
			console.error("Error creating item:", err);
			actionStore.addMessage("Error creating item");
		}
	}

	async function createCustomField(
		fieldName: string,
		dataType: string,
	): Promise<ICustomField> {
		console.log(
			`Creating custom field with name: ${fieldName}, dataType: ${dataType}`,
		);
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

	function handleFieldItemInput(event: Event) {
		const target = event.target as HTMLInputElement;
		fieldItemName = target.value;
		fieldItemId = null;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchFieldItems(fieldItemName);
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
		} catch
		(err) {
			console.error("Error checking item name:", err);
			return false;
		}
			
	}

</script>

<Dialog isLarge={true} bind:dialog create={() => {}} close={resetForm}>
	{#if duplicate}
		<h1 id="underline-header" class="font-bold text-center">
			Duplicate & Edit Item
		</h1>
	{:else}
		<h1 id="underline-header" class="font-bold text-center">
			Create New Item
		</h1>
	{/if}
	<div class="page-component large-dialog-internal">
		<form on:submit|preventDefault={handleCreateItem}>
			<div class="flex flex-col space-y-4">
				<div class="flex space-x-4">
					<!-- Name -->
					<label class="flex-column flex-grow">
						Name (required):
						<input
							class="dark-textarea py-2 px-4 w-full"
							type="text"
							placeholder="Toolbox"
							bind:value={name}
							required />
					</label>

					<!-- Tags -->
					<label class="flex-column flex-grow">
						Tags:
						<textarea
							rows="1"
							id="resize-none-textarea"
							class="dark-textarea py-2 px-4 w-full"
							bind:value={tags}></textarea>
					</label>
				</div>

				<!-- Description -->
				<label class="min-w-[400px]">
					Description:
					<textarea
						rows="4"
						id="resize-none-textarea"
						class="dark-textarea py-2 px-4 w-full"
						placeholder="My medium-sized, red toolbox"
						bind:value={description}></textarea>
				</label>

				<br />
				<div class="flex flex-col space-y-2">
					<ImageSelector on:imageChange={handleImageChange} />
				</div>
				<br />

				<Switch
					checked={sameLocations}
					onchange={() => {
						sameLocations = !sameLocations;
					}}>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.Label
						>Item is currently at its home location</Switch.Label>
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
								on:input={handleParentItemInput}
								on:focus={handleParentItemFocus}
								on:blur={() => (parentItemSuggestions = [])} />
							{#if parentItemSuggestions.length > 0}
								<ul class="suggestions suggestion-box">
									{#each parentItemSuggestions as item (item.id)}
										<button
											class="suggestion-item"
											type="button"
											on:mousedown={(e) => {
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
							on:input={handleHomeItemInput}
							on:focus={handleHomeItemFocus}
							on:blur={() => (homeItemSuggestions = [])} />
						{#if homeItemSuggestions.length > 0}
							<ul class="suggestions suggestion-box">
								{#each homeItemSuggestions as item (item.id)}
									<button
										class="suggestion-item"
										type="button"
										on:mousedown={(e) => {
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
				<br />

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
							on:input={handleTemplateInput}
							on:focus={handleTemplateFocus}
							on:blur={() => (templateSuggestions = [])} />
						{#if templateSuggestions.length > 0}
							<ul class="suggestions suggestion-box">
								{#each templateSuggestions as t (t.id)}
									<button
										class="suggestion-item"
										type="button"
										on:mousedown={(e) => {
											e.preventDefault();
											selectTemplate(t);
										}}>
										{t.name}
									</button>
								{/each}
							</ul>
						{/if}
					</label>
					<div>
						<br />
						<button
							type="button"
							class="border-button font-semibold shadow"
							on:click={() => (showCreateTemplateDialog = true)}>
							Create New Template
						</button>
					</div>
				</div>
			</div>
			<br />

			<!-- Custom Fields -->
			<div class="simple-flex px-2">
				<h2 class="font-bold text-lg">Custom Fields</h2>
				<button
					type="button"
					class="border-button font-semibold shadow small-add-button"
					on:click={addCustomFieldLine}>
					+
				</button>
			</div>
			{#each customFields as field, index (field.fieldId)}
				<CustomFieldPicker
					bind:field
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
							//here for check item field value
							checkIfItemExists(field.displayValue || '').then((itemId) => {
								if (itemId) {
									customFields[index].value = itemId;
									return true;
								} else {
									customFields[index].value = '';
									customFields[index].displayValue = '';
									placeholder = "Item not found";
									return false;
								}
							});

						}
					}}
					showDeleteButton={!field.fromTemplate}
					onDelete={() => removeCustomField(index)}>
					<svelte:fragment slot="suggestions">
						{#each field.suggestions as suggestion (suggestion._id)}
							<button
								class="suggestion-item"
								type="button"
								on:mousedown={(e) => {
									e.preventDefault();
									selectCustomFieldSuggestion(index, suggestion);
								}}>
								{suggestion.fieldName} ({suggestion.dataType})
							</button>
						{/each}
					</svelte:fragment>
					
					<svelte:fragment slot="itemSuggestions">
						{#if field.dataType === 'item' && fieldItemSuggestions.length > 0}
							<ul class="suggestions suggestion-box">
								{#each fieldItemSuggestions as item (item._id)}
									<button
										class="suggestion-item"
										type="button"
										on:mousedown={(e) => {
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
					</svelte:fragment>
				</CustomFieldPicker>
			{/each}

			<br />
			<!-- Submit -->
			<div class="flex justify-end">
				<button
					class="success-button font-semibold shadow mt-4 w-full block"
					type="submit">
					Create Item
				</button>
			</div>
		</form>
	</div>
</Dialog>

<!-- Create Template Dialog -->
{#if showCreateTemplateDialog}
	<Dialog
		bind:dialog={templateDialog}
		isLarge={false}
		create={() => {}}
		close={() => {
			showCreateTemplateDialog = false;
		}}>
		<CreateTemplate
			on:close={() => {
				showCreateTemplateDialog = false;
			}} />
	</Dialog>
{/if}
