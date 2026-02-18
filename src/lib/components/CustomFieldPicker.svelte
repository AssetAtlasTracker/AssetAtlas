<script lang="ts">
	import { browser } from '$app/environment';
	import type { ICustomFieldEntry } from '$lib/types/customField';
	import type { Snippet } from "svelte";
	import { onMount } from "svelte";
	import { checkIfItemExistsById } from "../stores/createItemStore.svelte";
	import InfoToolTip from "./InfoToolTip.svelte";
	 
	let {
		field = $bindable(),
		onFieldNameInput,
		onFieldFocus,
		onFieldBlur,
		placeholder = "Search for item...",
		onFieldValueInput = undefined,
		onFieldValueFocus = undefined,
		onFieldValueBlur = undefined,
		showDeleteButton = true,
		duplicate = false,
		onDelete,
		mode = "item",
		suggestions,
		itemSuggestions
	} = $props<{
		field: ICustomFieldEntry;
		onFieldNameInput: (event: Event) => void;
		onFieldFocus: () => void;
		onFieldBlur: () => void;
		placeholder?: string;
		onFieldValueInput?: (event: Event) => void;
		onFieldValueFocus?: () => void;
		onFieldValueBlur?: () => void;
		showDeleteButton: boolean;
		duplicate?: boolean;
		onDelete: () => void;
		mode?: "template" | "item";
		suggestions?: Snippet;
		itemSuggestions?: Snippet;
	}>();

	const dataTypes = ["string", "number", "boolean", "date", "item"];

	$effect.pre(() => {
		if (!field.dataType) {
			field.dataType = "string";
		}
	});

	let previousDataType = field.dataType;
	$effect(() => {
		if (!field.fromTemplate && field.dataType !== previousDataType) {
			if (field.value && previousDataType) {
				field.value = "";
			}
			previousDataType = field.dataType;
		}
	});
    
	let isItemValueValid = $state(false);

	onMount(async () => {
		if (field.dataType === "item" && duplicate && !field.displayValue && field.value) {
			const itemName = await checkIfItemExistsById(field.value);
			field.displayValue = itemName || '';
		}
	});

	async function redirectToItem(itemId: string) {
		if (!browser) {
			return;
		}			
		window.open(`/view/${itemId}`, "_blank");
	}
    
	async function handleFieldValueBlur() {
		if (onFieldValueBlur) {
			try {
				await onFieldValueBlur();
				// Check if a valid item ID was set
				isItemValueValid = !!field.value;
			} catch {
				isItemValueValid = false;
			}
		}
	}
    
	function validateNumberInput(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.value && isNaN(Number(input.value))) {
			input.value = "";
		}
	}
</script>

<div class="add-field-container">
	<div class="simple-flex justify-between" style="position: relative">
		<!-- Keep name and exit button on same row-->
		<!-- Field Name Section -->
		<input
			type="text"
			placeholder="Field Name"
			bind:value={field.fieldName}
			oninput={onFieldNameInput}
			onfocus={onFieldFocus}
			onblur={onFieldBlur}
			disabled={field.fromTemplate}
			class="dark-textarea py-2 px-4"
		/>
		{#if field.suggestions?.length > 0}
			<ul class="suggestions suggestion-box">
				{@render suggestions?.()}
			</ul>
		{/if}

		<!-- Control Section -->
		{#if field.fromTemplate}
			<InfoToolTip
				message="This field is required by the template and cannot be removed. Can be left blank if desired."
			/>
		{:else if showDeleteButton}
			<button type="button" class="x-button flex" onclick={onDelete}> X </button>
		{/if}
	</div>

	<div class="simple-flex">
		<!-- Keep dropdown and value on same row-->
		<!-- Data Type Section -->
		<div class="custom-dropdown basis-30">
			<select
				disabled={field.fromTemplate || field.isExisting}
				bind:value={field.dataType}
			>
				{#each dataTypes as dt}
					<option value={dt}>{dt}</option>
				{/each}
			</select>
		</div>

		<!-- Value Section (only in item mode) -->
		{#if mode === "item"}
			<div class="flex-grow" style="position: relative">
				{#if field.dataType === "boolean"}
					<div class="custom-dropdown flex-grow">
						<select bind:value={field.value} class="dropdown-box">
							<option value="true">Yes</option>
							<option value="false">No</option>
						</select>
					</div>
				{:else if field.dataType === "number"}
					<input
						type="number"
						bind:value={field.value}
						oninput={validateNumberInput}
						class="dark-textarea py-2 px-4 flex-grow"
					/>
				{:else if field.dataType === "date"}
					<input
						type="date"
						bind:value={field.value}
						class="dark-textarea px-4 flex-grow"
					/>
				{:else if field.dataType === "item"}
					<input
						type="text"
						bind:value={field.displayValue}
						oninput={onFieldValueInput}
						onfocus={onFieldValueFocus}
						onblur={handleFieldValueBlur}
						class="dark-textarea py-2 px-4 flex-grow"
						placeholder={placeholder}
					/>
					{@render itemSuggestions?.()}
					<button
						type="button"
						unselectable={isItemValueValid ? "off" : "on"} 
						onclick={() => redirectToItem(field.value)}
						class="success-button"
					>Check Item</button>
				{:else}
					<input
						type="text"
						bind:value={field.value}
						class="dark-textarea py-2 px-4 flex-grow"
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>
