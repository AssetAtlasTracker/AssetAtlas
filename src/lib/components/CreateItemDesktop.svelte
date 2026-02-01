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
		handleTemplateInput,
		handleParentItemFocus,
		handleHomeItemFocus,
		handleTemplateFocus,
		handleCustomFieldFocus,
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
		loadAllTemplates,
	} from "$lib/stores/createItemStore.svelte";
	import { createEventDispatcher, onMount } from "svelte";

	import { collection } from "@zag-js/combobox";

	export let dialog: HTMLDialogElement;
	export let duplicate = false;

	let templateDialog: HTMLDialogElement | undefined;
	let showCreateTemplateDialog = false;
	let imageSelector: ImageSelector;
	let allTemplates: any[] = [];
	let filteredTemplates: any[] = [];

	const dispatch = createEventDispatcher();

	onMount(async () => {
		const raw = await loadAllTemplates();
		console.log(raw);
		allTemplates = raw
			.map((t) => ({ ...t, _id: t?._id ?? t?.id }))
			.filter((t) => t?._id);
		filteredTemplates = allTemplates;
	});

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

	function onTemplateInputValueChange(details: { inputValue: string }) {
		createItemState.templateName = details.inputValue;
		const query = details.inputValue.trim().toLowerCase();
		filteredTemplates = query
			? allTemplates.filter((t) => t?.name?.toLowerCase().includes(query))
			: allTemplates;
	}

	function onTemplateSelect(details: { itemValue?: string }) {
		if (!details.itemValue) return;
		const selected = allTemplates.find(
			(t) => String(t._id) === details.itemValue,
		);
		if (selected) {
			selectTemplate(selected);
			filteredTemplates = allTemplates; 
		}
	}

	setOnItemCreated(() => {
		if (dialog) {
			dialog.close();
		}
		dispatch("itemCreated");
	});
	initializeItemEdit();

	async function submitItem() {
		if (dialog) {
			dialog.close();
		}
		await handleCreateItem();
		imageSelector.resetImage();
		resetAllFields();
	}
</script>

<Dialog isLarge={true} bind:dialog create={() => {}} close={resetAllFields}>
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
		<form on:submit|preventDefault={submitItem}>
			<div class="flex flex-col space-y-4">
				<div class="flex space-x-4">
					<!-- Name -->
					<label class="flex-column flex-grow">
						Name (required):
						<input
							class="dark-textarea py-2 px-4 w-full"
							type="text"
							placeholder="Toolbox"
							bind:value={createItemState.name}
							required
						/>
					</label>

					<!-- Tags -->
					<label class="flex-column flex-grow">
						Tags:
						<textarea
							rows="1"
							id="resize-none-textarea"
							class="dark-textarea py-2 px-4 w-full"
							bind:value={createItemState.tags}
						></textarea>
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
						bind:value={createItemState.description}
					></textarea>
				</label>

				<!-- Image -->
				<br />
				<div class="flex flex-col space-y-2">
					<ImageSelector
						bind:this={imageSelector}
						on:imageChange={handleImageChange}
					/>
				</div>
				<br />

				<Switch
					checked={createItemState.sameLocations}
					onchange={() => {
						createItemState.sameLocations =
							!createItemState.sameLocations;
					}}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.Label
						>Item is currently at its home location</Switch.Label
					>
					<Switch.HiddenInput />
				</Switch>

				<div class="flex space-x-4">
					<!-- Parent Item -->
					{#if !createItemState.sameLocations}
						<label class="flex-column flex-grow relative">
							<div class="flex items-center gap-2">
								<span>Current Location:</span>
								<InfoToolTip
									message="Where an item currently is, e.g. a shirt's parent item may be a suitcase."
								/>
							</div>
							<input
								type="text"
								class="dark-textarea py-2 px-4 w-full"
								bind:value={createItemState.parentItemName}
								on:input={handleParentItemInput}
								on:focus={handleParentItemFocus}
								on:blur={() =>
									(createItemState.parentItemSuggestions =
										[])}
							/>
							{#if createItemState.parentItemSuggestions.length > 0}
								<ul class="suggestions suggestion-box">
									{#each createItemState.parentItemSuggestions as item (item.id)}
										<button
											class="suggestion-item"
											type="button"
											on:mousedown={(e) => {
												e.preventDefault();
												selectParentItem(item);
											}}
										>
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
								message="Where an item should normally be, e.g a shirt's home item may be a drawer."
							/>
						</div>
						<input
							type="text"
							class="dark-textarea py-2 px-4 w-full"
							bind:value={createItemState.homeItemName}
							on:input={handleHomeItemInput}
							on:focus={handleHomeItemFocus}
							on:blur={() =>
								(createItemState.homeItemSuggestions = [])}
						/>
						{#if createItemState.homeItemSuggestions.length > 0}
							<ul class="suggestions suggestion-box">
								{#each createItemState.homeItemSuggestions as item (item.id)}
									<button
										class="suggestion-item"
										type="button"
										on:mousedown={(e) => {
											e.preventDefault();
											selectHomeItem(item);
										}}
									>
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
								message="A template is a more narrow category of similar items that share common fields. Select an existing template or create a new one."
							/>
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
					</label>
					<div>
						<br />
						<button
							type="button"
							class="border-button font-semibold shadow"
							on:click={() => (showCreateTemplateDialog = true)}
						>
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
					on:click={addCustomFieldLine}
				>
					+
				</button>
			</div>
			{#each createItemState.customFields as field, index (field.fieldId)}
				<CustomFieldPicker
					bind:field
					onFieldNameInput={(e) => onCustomFieldNameInput(index, e)}
					onFieldFocus={() => handleCustomFieldFocus(index)}
					onFieldBlur={() =>
						(createItemState.customFields[index].suggestions = [])}
					showDeleteButton={!field.fromTemplate}
					onDelete={() => removeCustomField(index)}
				>
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
								}}
							>
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
					type="submit"
				>
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
		}}
	>
		<CreateTemplate
			on:close={() => {
				showCreateTemplateDialog = false;
			}}
		/>
	</Dialog>
{/if}
