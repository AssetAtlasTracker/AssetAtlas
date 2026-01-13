<script lang="ts">
	import CreateTemplate from "./CreateTemplate.svelte";
	import CustomFieldPicker from "./CustomFieldPicker.svelte";
	import Dialog from "./Dialog.svelte";
	import ImageSelector from "./ImageSelector.svelte";
	import InfoToolTip from "./InfoToolTip.svelte";
	import { Switch } from "@skeletonlabs/skeleton-svelte";
	import { CameraIcon } from '@lucide/svelte';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	import { 
		createItemState,
		handleCreateItem, 
		initializeItemEdit, 
		resetForm,
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
		setOnItemCreated
	} from "$lib/stores/createItemStore.svelte";
	import { createEventDispatcher } from "svelte";
	import "$lib/styles/mobile.css";

	export let dialog: HTMLDialogElement;
	export let duplicate = false;

	let templateDialog: HTMLDialogElement | undefined;
	let showCreateTemplateDialog = false;

	const dispatch = createEventDispatcher();

	$: if (showCreateTemplateDialog) {
		if (templateDialog) {
			templateDialog.showModal();
		}
	}

	setOnItemCreated(() => {
		dispatch("itemCreated")
	});
	initializeItemEdit();

	function submitItem() {
		if (dialog) {
			dialog.close();
		}
		handleCreateItem();
	}
</script>

<Dialog bind:dialog create={() => {}} close={resetForm}>
	{#if duplicate}
		<h1 id="underline-header" class="font-bold text-center">
			Duplicate & Edit Item
		</h1>
	{:else}
		<h1 id="underline-header" class="font-bold text-center">
			Create New Item
		</h1>
	{/if}
	<form on:submit|preventDefault={submitItem}>
		<div class="flex flex-col space-y-4">
			<div class="flex flex-col space-y-2">
				<ImageSelector on:imageChange={handleImageChange} />
				<!-- <FileUpload>
					<FileUpload.Dropzone>
						<CameraIcon class="size-32" />
						<span>Upload Image</span>
						<FileUpload.Trigger>Browse Files</FileUpload.Trigger>
						<FileUpload.HiddenInput />
					</FileUpload.Dropzone>
					<FileUpload.ItemGroup>
						<FileUpload.Context>
							{#snippet children(fileUpload)}
								{#each fileUpload().acceptedFiles as file (file.name)}
									<FileUpload.Item {file}>
										<FileUpload.ItemName>{file.name}</FileUpload.ItemName>
										<FileUpload.ItemSizeText>{file.size} bytes</FileUpload.ItemSizeText>
										<FileUpload.ItemDeleteTrigger />
									</FileUpload.Item>
								{/each}
							{/snippet}
						</FileUpload.Context>
					</FileUpload.ItemGroup>
					<FileUpload.ClearTrigger>Clear Files</FileUpload.ClearTrigger>
				</FileUpload> -->
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

			<div class="flex space-x-4">
				<!-- Home Item -->
				<label class="flex-column flex-grow relative">
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
				</label>
			</div>

			<div class="flex space-x-4">
				<!-- Parent Item -->
				{#if !createItemState.sameLocations}
					<label class="flex-column flex-grow relative">
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
					</label>
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
			<div class="flex space-x-4 items-center">
				<label class="flex-column flex-grow relative">
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
					<input
						type="text"
						class="dark-textarea py-2 px-4 w-full"
						bind:value={createItemState.templateName}
						on:input={handleTemplateInput}
						on:focus={handleTemplateFocus}
						on:blur={() => (createItemState.templateSuggestions = [])} />
					{#if createItemState.templateSuggestions.length > 0}
						<ul class="suggestions suggestion-box">
							{#each createItemState.templateSuggestions as t (t.id)}
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
		<div id="submit-button-container" class="flex justify-end mt-4">
			<button
				class="border-button font-semibold shadow mt-4 mr-2 w-full block">
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
