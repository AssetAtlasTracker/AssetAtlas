<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import type {
		ICustomField,
		ICustomFieldEntryInstance,
	} from "$lib/types/customField";
	import { createEventDispatcher } from "svelte";
	import { actionStore } from "../stores/actionStore.js";
	import Dialog from "./Dialog.svelte";

	let {
		dialog = $bindable(),
		item
	} = $props<{
		dialog?: HTMLDialogElement;
		item: IBasicItemPopulated;
	}>();

	const dispatch = createEventDispatcher();

	let name = $state("");
	let description = $state("");
	let tags = $state("");

	let parentItemId = $state<string | null>(null);
	let homeItemId = $state<string | null>(null);
	let templateId = $state<string | null>(null);
	let selectedImage = $derived<string | null>(item.image ? item.image : null);

	let customFields = $state<ICustomFieldEntryInstance[]>([]);

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
		name = "Copy of " + currentItem.name;
		description = currentItem.description ?? "";
		tags = currentItem.tags.toString();
		parentItemId = currentItem.parentItem
			? currentItem.parentItem._id.toString()
			: null;
		homeItemId = currentItem.homeItem
			? currentItem.homeItem._id.toString()
			: null;
		templateId = currentItem.template
			? currentItem.template?._id.toString()
			: null;
		customFields = buildCustomFields(currentItem);
		selectedImage = item.image ? item.image : null;
	}

	$effect(() => {
		updateFromItem(item);
	});

	export function changeItem(newItem: IBasicItemPopulated) {
		item = newItem;
		updateFromItem(newItem);
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

	async function duplicateItem() {
		try {
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
			formData.append("tags", JSON.stringify(tags));
			if (parentItemId) formData.append("parentItem", parentItemId);
			if (homeItemId) formData.append("homeItem", homeItemId);
			if (templateId) formData.append("template", templateId);
			formData.append(
				"customFields",
				JSON.stringify(formattedCustomFields),
			);
			if (selectedImage) formData.append("image", selectedImage);

			const response = await fetch(`/api/items`, {
				method: "POST",
				body: formData,
			});

			const rawText = await response.text();
			const data = JSON.parse(rawText);

			if (!response.ok) {
				actionStore.addMessage("Error creating item");
				throw new Error(data.message || "Error creating item");
			}

			actionStore.addMessage("Item created successfully!");
			dispatch("itemCreated");
			dialog?.close();
		} catch (err) {
			console.error("Error creating item:", err);
			actionStore.addMessage("Error creating item");
		}
	}
</script>

<Dialog
	bind:dialog
	isLarge={false}
	close={() => dialog?.close()}>
	<div class="small-dialog-padding">
		Are you sure you want to duplicate "{item.name}"?
		<div class="simple-flex pt-4">
			<button
				onclick={() => dialog?.close()}
				class="border-button flex-grow">
				Cancel
			</button>
			<button onclick={duplicateItem} class="success-button flex-grow">
				Duplicate
			</button>
		</div>
	</div>
</Dialog>
