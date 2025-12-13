<script lang="ts">
    import type { ICustomFieldEntry, ICustomField } from "$lib/types/customField";

	import { actionStore } from "$lib/stores/actionStore.js";
	import { createEventDispatcher } from "svelte";

    import CreateTemplate from "./CreateTemplate.svelte";
	import CustomFieldPicker from "./CustomFieldPicker.svelte";
	import Dialog from "./Dialog.svelte";
	import ImageSelector from "./ImageSelector.svelte";
	import InfoToolTip from "./InfoToolTip.svelte";
	import { Switch } from "@skeletonlabs/skeleton-svelte";

	const dispatch = createEventDispatcher();

    export let dialog: HTMLDialogElement;
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
	let templateName = "";
	let templateId: string | null = null;
	let templateSuggestions: any[] = [];
    let customFields: ICustomFieldEntry[] = [];
	let selectedImage: File | null = null;

	let templateDialog: HTMLDialogElement | undefined;
    let showCreateTemplateDialog = false;
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

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

			customFields = customFields.filter((field) => {
				if (field.fromTemplate) return true;
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
						const createdField = await createCustomField(
							field.fieldName,
							field.dataType,
						);
						return { field: createdField._id, value: field.value };
					}
				}),
			);

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

			const rawText = await response.text();
			console.log("Raw response:", rawText);

			const data = JSON.parse(rawText);

			if (!response.ok) {
				actionStore.addMessage("Error creating item");
				throw new Error(data.message || "Error creating item");
			}
			console.log("Item created:", data);
			actionStore.addMessage("Item created successfully!");
			dialog.close();
			dispatch("itemCreated");

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
		const response = await fetch(`/api/customFields`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fieldName, dataType }),
		});
		return await response.json();
	}

    $: if (showCreateTemplateDialog) {
		if (templateDialog) {
			templateDialog.showModal();
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
					<Switch.Label>Item is currently at its home location</Switch.Label>
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
					showDeleteButton={!field.fromTemplate}
					onDelete={() => removeCustomField(index)}>
					<svelte:fragment slot="suggestions">
						{#each field.suggestions as suggestion (suggestion._id)}
							<button
								class="suggestion-item"
								type="button"
								on:mousedown={(e) => {
									e.preventDefault();
									selectCustomFieldSuggestion(
										index,
										suggestion,
									);
								}}>
								{suggestion.fieldName} ({suggestion.dataType})
							</button>
						{/each}
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