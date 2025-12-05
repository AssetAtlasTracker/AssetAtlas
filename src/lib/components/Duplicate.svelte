<script lang="ts">
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import { ip } from "$lib/stores/ipStore.js";
	import Dialog from "./Dialog.svelte";
	import { actionStore } from "../stores/actionStore.js";
	import { createEventDispatcher } from "svelte";
	export let dialog: HTMLDialogElement;
	export let item: IBasicItemPopulated;
	export let onDuplicate = () => {};

	const dispatch = createEventDispatcher();

	let name = "Copy of " + item.name;
	let description = "";
	if (item.description) {
		description = item.description;
	}
	let tags = item.tags.toString();
	let parentItemName = "";
	if (item.parentItem?.name != null) {
		parentItemName = item.parentItem?.name;
	}
	let parentItemId: string | null = null;
	if (item.parentItem) {
		parentItemId = item.parentItem._id.toString();
	}
	let parentItemSuggestions: any[] = [];
	let homeItemName = "";
	if (item.homeItem?.name != null) {
		homeItemName = item.homeItem?.name;
	}
	let homeItemId: string | null = null;
	if (item.homeItem) {
		homeItemId = item.homeItem._id.toString();
	}
	let homeItemSuggestions: any[] = [];
	let templateName = "";
	let templateId: string | null = null;
	if (item.template) {
		templateName = item.template?.name;
		templateId = item.template?._id.toString();
	}
	let templateSuggestions: any[] = [];
	let selectedImage: File | null = null;

	export function changeItem(newItem: IBasicItemPopulated) {
		console.log("item changed");
		item = newItem;
		name = "Copy of " + item.name;
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
		suggestions: ICustomField[];
		isNew: boolean;
		isSearching: boolean;
		isExisting: boolean;
		fromTemplate: boolean;
		searchTimeout?: ReturnType<typeof setTimeout>;
	}

	let customFields: ICustomFieldEntry[] = [];
	if (item.customFields?.length) {
		//First load non-template fields
		let nonTemplateFields = item.customFields.map((cf) => ({
			fieldName: cf.field.fieldName,
			fieldId: cf.field._id as string,
			dataType: cf.field.dataType,
			value: cf.value as string,
			suggestions: [],
			isNew: false,
			isSearching: false,
			isExisting: true,
			fromTemplate: false,
		}));

		if (item.template && item.template.fields?.length) {
			const templateFieldIds = new Set(
				item.template.fields.map((tid: any) =>
					typeof tid === "string" ? tid : tid._id.toString(),
				),
			);

			//Split fields into template and non-template
			const templateFields = nonTemplateFields
				.filter(
					(field) =>
						field.fieldId && templateFieldIds.has(field.fieldId.toString()),
				)
				.map((field) => ({ ...field, fromTemplate: true }));

			const remainingFields = nonTemplateFields.filter(
				(field) =>
					!field.fieldId || !templateFieldIds.has(field.fieldId.toString()),
			);

			//Combine with template fields first
			customFields = [...templateFields, ...remainingFields];
		} else {
			customFields = nonTemplateFields;
		}
	}

	if (item.template && item.template.fields?.length) {
		const templateFieldIds = new Set(
			item.template.fields.map((tid: any) =>
				typeof tid === "string" ? tid : tid._id.toString(),
			),
		);

		customFields = customFields.map((field) => ({
			...field,
			fromTemplate: field.fieldId
				? templateFieldIds.has(field.fieldId.toString())
				: false,
		}));
	}
	async function createCustomField(
		fieldName: string,
		dataType: string,
	): Promise<ICustomField> {
		const response = await fetch(`http://${$ip}/api/customFields`, {
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
			formData.append("customFields", JSON.stringify(formattedCustomFields));
			if (selectedImage) formData.append("image", selectedImage);
			console.log("Sending request with formData:");
			for (const pair of (formData as any).entries()) {
				console.log(pair[0], pair[1]);
			}

			const response = await fetch(`http://${$ip}/api/items`, {
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
			dispatch("itemCreated");
			dialog.close();
		} catch (err) {
			console.error("Error creating item:", err);
			actionStore.addMessage("Error creating item");
		}
	}
</script>

<Dialog bind:dialog>
	<div class="small-dialog-padding">
		Are you sure you want to duplicate "{item.name}"?
		<div class="simple-flex pt-4">
			<button on:click={() => dialog.close()} class="border-button flex-grow">
				Cancel
			</button>
			<button on:click={duplicateItem} class="success-button flex-grow">
				Duplicate
			</button>
		</div>
	</div>
</Dialog>
