<script lang="ts">
	import CreateTemplate from "./CreateTemplate.svelte";
	import CustomFieldPicker from "./CustomFieldPicker.svelte";
	import Dialog from "./Dialog.svelte";
	import ImageSelector from "./ImageSelector.svelte";
	import InfoToolTip from "./InfoToolTip.svelte";
	import { Switch, Combobox } from "@skeletonlabs/skeleton-svelte";
	import { browser } from "$app/environment";
	import { 
		createItemState,
		handleCreateItem, 
		initializeItemEdit, 
		handleParentItemInput,
		handleHomeItemInput,
		handleParentItemFocus,
		handleHomeItemFocus,
		handleTemplateFocus,
		handleCustomFieldFocus,
		handleFieldItemInput,
		handleFieldItemFocus,
		onCustomFieldNameInput,
		selectParentItem,
		selectHomeItem,
		selectTemplate,
		selectCustomFieldSuggestion,
		addCustomFieldLine,
		removeCustomField,
		handleImageChange,
		setOnItemCreated,
		resetAllFields,
		partialResetFields,
		checkIfItemExists,
		loadAllTemplates,
		submitAndCloseItem
	} from "$lib/stores/createItemStore.svelte";
	import { createEventDispatcher, onMount } from "svelte";
	import "$lib/styles/mobile.css";

	import { collection } from "@zag-js/combobox";

	export let dialog: HTMLDialogElement;
	export let duplicate = false;
	export let filteredTemplates: any[] = [];
	export let onTemplateInputValueChange: (details: { inputValue: string }) => void;
	export let onTemplateSelect: (details: { itemValue?: string }) => void;

	let templateDialog: HTMLDialogElement | undefined;
	let showCreateTemplateDialog = false;
	let formElement: HTMLFormElement;
	let imageSelector: ImageSelector;

	const dispatch = createEventDispatcher();

	$: if (showCreateTemplateDialog) {
		if (templateDialog) {
			templateDialog.showModal();
		}
	}

	$: templateCollection = collection({
		items: filteredTemplates,
		itemToString: (item) => item?.name ?? "",
		itemToValue: (item) => String(item?._id ?? ""),
	});

	setOnItemCreated(() => {
		dispatch("itemCreated")
	});
	initializeItemEdit();

	async function submitAndAddAnother() {
		if (!formElement.checkValidity()) {
			formElement.reportValidity();
			return;
		}
		let success = await handleCreateItem();
		if (success) {
			imageSelector.resetImage();
			partialResetFields();
		}
	}
</script>

<Dialog bind:dialog create={() => {}} close={resetAllFields}>
	{#if duplicate}
		<h1 id="underline-header" class="font-bold text-center">
			Duplicate & Edit Item
		</h1>
	{:else}
		<h1 id="underline-header" class="font-bold text-center">
			Create New Item
		</h1>
	{/if}
	<form bind:this={formElement} on:submit|preventDefault={() => submitAndCloseItem(dialog, imageSelector)}>
		<div class="flex flex-col space-y-4">
			<div class="flex flex-col space-y-2">
				<ImageSelector bind:this={imageSelector} on:imageChange={handleImageChange} />
			</div>

			<div class="flex space-x-4">
				<!-- Name -->
				<label class="flex-column flex-grow">
					Name (required):
					<input
						class="dark-textarea py-2 px-4 w-full"
						type="text"
						placeholder="Toolbox"
						bind:value={createItemState.name}
						required />
				</label>
			</div>

			<div class="flex space-x-4">
				<!-- Tags -->
				<label class="flex-column flex-grow">
					Tags:
					<textarea
						rows="1"
						id="resize-none-textarea"
						class="dark-textarea py-2 px-4 w-full"
						bind:value={createItemState.tags}></textarea>
				</label>
			</div>

			<Switch
				checked={createItemState.sameLocations}
				onchange={() => {
					createItemState.sameLocations = !createItemState.sameLocations;
				}}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label
				>Item is currently at its home location</Switch.Label>
				<Switch.HiddenInput />
			</Switch>

			<!-- Home Item -->
			<div class="flex-column flex-grow relative">
				<div class="flex items-center gap-2 mb-1">
					<span>Home Location:</span>
					<InfoToolTip
						message="Where an item should normally be, e.g a shirt's home item may be a drawer." />
				</div>
				<input
					type="text"
					class="dark-textarea py-2 px-4 w-full"
					bind:value={createItemState.homeItemName}
					on:input={handleHomeItemInput}
					on:focus={handleHomeItemFocus}
					on:blur={() => (createItemState.homeItemSuggestions = [])} />
				{#if createItemState.homeItemSuggestions.length > 0}
					<ul class="suggestions suggestion-box">
						{#each createItemState.homeItemSuggestions as item (item.id)}
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
			</div>

			<!-- Parent Item -->
			<div class="flex-column flex-grow relative">
				{#if !createItemState.sameLocations}
					<div class="flex items-center gap-2 mb-1">
						<span>Current Location:</span>
						<InfoToolTip
							message="Where an item currently is, e.g. a shirt's parent item may be a suitcase." />
					</div>
					<input
						type="text"
						class="dark-textarea py-2 px-4 w-full"
						bind:value={createItemState.parentItemName}
						on:input={handleParentItemInput}
						on:focus={handleParentItemFocus}
						on:blur={() => (createItemState.parentItemSuggestions = [])} />
					{#if createItemState.parentItemSuggestions.length > 0}
						<ul class="suggestions suggestion-box">
							{#each createItemState.parentItemSuggestions as item (item.id)}
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
				{/if}
			</div>
			<br />

			<!-- Description -->
			<label>
				Description:
				<textarea
					rows="4"
					id="resize-none-textarea"
					class="dark-textarea py-2 px-4 w-full"
					placeholder="My medium-sized, red toolbox"
					bind:value={createItemState.description}></textarea>
			</label>

			<!-- Template Field and Create Template Button -->
			<div class="flex-column flex-grow relative">
				<div class="flex items-end justify-between w-full mb-1">
					<div class="flex items-center gap-2">
						<span>Template:</span>
						<InfoToolTip
							message="A template is a more narrow category of similar items that share common fields. Select an existing template or create a new one." />
					</div>
					<button
						type="button"
						class="border-button shadow m-1"
						on:click={() => (showCreateTemplateDialog = true)}>
						Create New Template
					</button>
				</div>
				{#if browser}
					<Combobox
						collection={templateCollection}
						openOnClick={true}
						inputValue={createItemState.templateName}
						onInputValueChange={onTemplateInputValueChange}
						onSelect={onTemplateSelect}
					>
						<Combobox.Control class="w-full">
							<Combobox.Input
								class="dark-textarea py-2 px-4 w-full"
								on:focus={handleTemplateFocus}
							/>
							<Combobox.Trigger
								aria-label="Open templates"
							/>
						</Combobox.Control>

						<Combobox.Positioner>
							<Combobox.Content
								class="bg-surface-3 text-white shadow-lg rounded-md mt-1 max-h-60 overflow-auto z-50"
							>
								{#each filteredTemplates as t (t._id)}
									<Combobox.Item
										item={t}
										class="text-black"
									>
										<Combobox.ItemText
										>{t.name}</Combobox.ItemText
										>
									</Combobox.Item>
								{/each}
							</Combobox.Content>
						</Combobox.Positioner>
					</Combobox>
				{:else}
					<select
						class="dark-textarea py-2 px-4 w-full"
						disabled
					>
						<option>Loading templates…</option>
					</select>
				{/if}
			</div>
		</div>
		<br />

		<!-- Custom Fields -->
		<span>Custom Fields:</span>
			
		<button
			type="button"
			id="create-custom-field-button"
			class="border-button font-semibold shadow small-add-button w-full"
			on:click={addCustomFieldLine}>
			+
		</button>
		{#each createItemState.customFields as field, index (field.fieldId)}
			<CustomFieldPicker
				bind:field
				onFieldNameInput={(e) => onCustomFieldNameInput(index, e)}
				onFieldFocus={() => handleCustomFieldFocus(index)}
				onFieldBlur={() => (createItemState.customFields[index].suggestions = [])}
				placeholder={createItemState.placeholder}
				onDuplicateAndEdit={duplicate}
				onFieldValueInput={(e) => {
					const target = e.target as HTMLInputElement;
					if (field.dataType === 'item') {
						createItemState.customFields[index].displayValue = target.value;
						createItemState.customFields[index].value = '';
						handleFieldItemInput(e);
					} else {
						createItemState.customFields[index].value = target.value;
					}
				}}
				onFieldValueFocus={() => {
					if (field.dataType === 'item') {
						handleFieldItemFocus();
					}
				}}
				onFieldValueBlur={() => {
					if (field.dataType === 'item') {
						createItemState.fieldItemSuggestions = [];
						checkIfItemExists(field.displayValue || '').then((itemId) => {
							if (itemId) {
								createItemState.customFields[index].value = itemId;
								return true;
							} else {
								createItemState.customFields[index].value = '';
								createItemState.customFields[index].displayValue = '';
								createItemState.placeholder = "Item not found";
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
								selectCustomFieldSuggestion(
									index,
									suggestion,
								);
							}}>
							{suggestion.fieldName} ({suggestion.dataType})
						</button>
					{/each}
				</svelte:fragment>
				
				<svelte:fragment slot="itemSuggestions">
					{#if field.dataType === 'item' && createItemState.fieldItemSuggestions.length > 0}
						<ul class="suggestions suggestion-box">
							{#each createItemState.fieldItemSuggestions as item (item._id)}
								<button
									class="suggestion-item"
									type="button"
									on:mousedown={(e) => {
										e.preventDefault();
										createItemState.customFields[index].value = item._id; // Store ID
										createItemState.customFields[index].displayValue = item.name; // Display name
										createItemState.fieldItemSuggestions = [];
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
		<div id="submit-button-container" class="flex justify-end mt-4">
			<button on:click={submitAndAddAnother}
				class="border-button font-semibold shadow mt-4 mr-2 w-full block"
				type="button">
				Save and Add Another
			</button>
			<button
				class="success-button font-semibold shadow mt-4 ml-2 w-full block"
				type="submit">
				Save and Exit
			</button>
		</div>
	</form>
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
