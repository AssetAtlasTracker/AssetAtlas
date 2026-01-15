<script lang="ts">
	import InfoToolTip from "./InfoToolTip.svelte";
	export let field;
	export let onFieldNameInput: (event: Event) => void;
	export let onFieldFocus: () => void;
	export let onFieldBlur: () => void;
	export let placeholder: string = "Search for item...";
	export let onFieldValueInput: ((event: Event) => void) | undefined = undefined;
	export let onFieldValueFocus: (() => void) | undefined = undefined;
	export let onFieldValueBlur: (() => void) | undefined = undefined;
	export let showDeleteButton = true;
	export let onDelete: () => void;
	export let mode: "template" | "item" = "item";

	const dataTypes = ["string", "number", "boolean", "date", "item"];

	$: if (!field.dataType) {
		field.dataType = "string";
	}
	let previousDataType = field.dataType;
	$: if (!field.fromTemplate && field.dataType !== previousDataType) {
		if (field.value && previousDataType) {
			field.value = "";
		}
		previousDataType = field.dataType;
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
			on:input={onFieldNameInput}
			on:focus={onFieldFocus}
			on:blur={onFieldBlur}
			disabled={field.fromTemplate}
			class="dark-textarea py-2 px-4"
		/>
		{#if field.suggestions?.length > 0}
			<ul class="suggestions suggestion-box">
				<slot name="suggestions" />
			</ul>
		{/if}

		<!-- Control Section -->
		{#if field.fromTemplate}
			<InfoToolTip
				message="This field is required by the template and cannot be removed. Can be left blank if desired."
			/>
		{:else if showDeleteButton}
			<button type="button" class="x-button flex" on:click={onDelete}> X </button>
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
						on:input={validateNumberInput}
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
						on:input={onFieldValueInput}
						on:focus={onFieldValueFocus}
						on:blur={onFieldValueBlur}
						class="dark-textarea py-2 px-4 flex-grow"
						placeholder={placeholder}
					/>
					<slot name="itemSuggestions" />
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
