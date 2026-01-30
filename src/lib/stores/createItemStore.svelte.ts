import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem";
import type { ICustomField, ICustomFieldEntryInstance } from "$lib/types/customField";

import { addToRecents } from "$lib/utility/recentItemHelper";
import { actionStore } from "$lib/stores/actionStore";
import { uploadImage } from '$lib/utility/imageUpload.js';


let item = $state<IBasicItemPopulated | null>(null);
let duplicate = $state(false);

let _name = $state("");
let _description = $state("");
let _tags = $state("");
let _parentItemName = $state("");
let _parentItemId = $state<string | null>(null);
let _sameLocations = $state(true);
let _parentItemSuggestions = $state<any[]>([]);
let _homeItemName = $state("");
let _homeItemId = $state<string | null>(null);
let _homeItemSuggestions = $state<any[]>([]);
let _fieldItemName = $state("");
let _fieldItemId = $state<string | null>(null);
let _fieldItemSuggestions = $state<any[]>([]);
let _templateName = $state("");
let _templateId = $state<string | null>(null);
let _templateSuggestions = $state<any[]>([]);
let _customFields = $state<ICustomFieldEntryInstance[]>([]);
let _selectedImage = $state<File | null>(null);
let _placeholder = $state("Search for item...");

export const createItemState = {
	get name() { return _name; },
	set name(v) { _name = v; },
	get description() { return _description; },
	set description(v) { _description = v; },
	get tags() { return _tags; },
	set tags(v) { _tags = v; },
	get parentItemName() { return _parentItemName; },
	set parentItemName(v) { _parentItemName = v; },
	get parentItemId() { return _parentItemId; },
	set parentItemId(v) { _parentItemId = v; },
	get sameLocations() { return _sameLocations; },
	set sameLocations(v) { _sameLocations = v; },
	get parentItemSuggestions() { return _parentItemSuggestions; },
	set parentItemSuggestions(v) { _parentItemSuggestions = v; },
	get homeItemName() { return _homeItemName; },
	set homeItemName(v) { _homeItemName = v; },
	get homeItemId() { return _homeItemId; },
	set homeItemId(v) { _homeItemId = v; },
	get homeItemSuggestions() { return _homeItemSuggestions; },
	set homeItemSuggestions(v) { _homeItemSuggestions = v; },
	get fieldItemName() { return _fieldItemName; },
	set fieldItemName(v) { _fieldItemName = v; },
	get fieldItemId() { return _fieldItemId; },
	set fieldItemId(v) { _fieldItemId = v; },
	get fieldItemSuggestions() { return _fieldItemSuggestions; },
	set fieldItemSuggestions(v) { _fieldItemSuggestions = v; },
	get templateName() { return _templateName; },
	set templateName(v) { _templateName = v; },
	get templateId() { return _templateId; },
	set templateId(v) { _templateId = v; },
	get templateSuggestions() { return _templateSuggestions; },
	set templateSuggestions(v) { _templateSuggestions = v; },
	get customFields() { return _customFields; },
	set customFields(v) { _customFields = v; },
	get selectedImage() { return _selectedImage; },
	set selectedImage(v) { _selectedImage = v; },
	get placeholder() { return _placeholder; },
	set placeholder(v) { _placeholder = v; },
};

let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
let onItemCreated: (() => void) | null = null;

export function setDuplicate(value: boolean) {
	duplicate = value;
}

export function setOnItemCreated(callback: () => void) {
	onItemCreated = callback;
}

export async function handleCreateItem() {
	try {
		if (_templateName.trim() && !_templateId) {
			alert(
				"Please select a valid template from the list or clear the field.",
			);
			return;
		}

		const tagsArray = _tags.split(",").map((tag) => tag.trim());

		if (_sameLocations) {
			_parentItemId = _homeItemId;
			_parentItemName = _homeItemName;
		}

		_customFields = _customFields.filter((field) => {
			if (field.fromTemplate) return true;
			return (
				field.fieldName.trim() !== "" &&
					field.dataType.trim() !== ""
			);
		});

		const formattedCustomFields = await Promise.all(
			_customFields.map(async (field) => {
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
		formData.append("name", _name);
		formData.append("description", _description);
		formData.append("tags", JSON.stringify(tagsArray));
		if (_parentItemId) formData.append("parentItem", _parentItemId);
		if (_homeItemId) formData.append("homeItem", _homeItemId);
		if (_templateId) formData.append("template", _templateId);
		if (_selectedImage) {
			const filename = await uploadImage(_selectedImage);
			formData.append("image", filename);
		}
		formData.append(
			"customFields",
			JSON.stringify(formattedCustomFields),
		);

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
		if (onItemCreated) {
			onItemCreated();
		}
	} catch (err) {
		console.error("Error creating item:", err);
		actionStore.addMessage("Error creating item");
	}
}

export function changeItem(newItem: IBasicItemPopulated){
	item = newItem;
	if (duplicate) {
		_name = item.name;
		if (item.description) {
			_description = item.description;
		}
		_tags = item.tags.toString();
		if (item.parentItem?.name != null) {
			_parentItemName = item.parentItem?.name;
		}
		if (item.parentItem) {
			_parentItemId = item.parentItem._id.toString();
		}
		if (item.homeItem?.name != null) {
			_homeItemName = item.homeItem?.name;
		}
		if (item.homeItem) {
			_homeItemId = item.homeItem._id.toString();
		}
		if (item.template) {
			_templateName = item.template?.name;
			_templateId = item.template?._id.toString();
		}

		if (item.customFields?.length) {
			let nonTemplateFields = item.customFields.map((cf) => ({
				fieldName: cf.field.fieldName,
				fieldId: cf.field._id as unknown as string,
				dataType: cf.field.dataType,
				value: cf.value as string,
				suggestions: [],
				isNew: false,
				isSearching: false,
				isExisting: true,
				fromTemplate: false,
				searchTimeout: undefined,
			}));

			if (item.template && item.template.fields?.length) {
				const templateFieldIds = new Set(
					item.template.fields.map((tid: any) =>
						typeof tid === "string" ? tid : tid._id.toString(),
					),
				);

				const templateFields = nonTemplateFields
					.filter((field) => field.fieldId && templateFieldIds.has(field.fieldId.toString()))
					.map((field) => ({ ...field, fromTemplate: true }));

				const remainingFields = nonTemplateFields.filter(
					(field) => !field.fieldId || !templateFieldIds.has(field.fieldId.toString())
				);

				_customFields = [...templateFields, ...remainingFields];
			} else {
				_customFields = nonTemplateFields;
			}
		}
	}
}

export function initializeItemEdit() {
	if (item != null) {
		_homeItemName = item.name;
		_homeItemId = item._id.toString();
		if (duplicate) {
			_name = item.name;
			if (item.description) {
				_description = item.description;
			}
			_tags = item.tags.toString();
			if (item.parentItem?.name != null) {
				_parentItemName = item.parentItem?.name;
			}
			if (item.parentItem) {
				_parentItemId = item.parentItem._id.toString();
			}
			if (item.homeItem?.name != null) {
				_homeItemName = item.homeItem?.name;
			}
			if (item.homeItem) {
				_homeItemId = item.homeItem._id.toString();
			}
			if (item.template) {
				_templateName = item.template?.name;
				_templateId = item.template?._id.toString();
			}
		}
	}
}

export function resetAllFields() {
	_name = "";
	_description = "";
	_tags = "";
	_parentItemName = "";
	_parentItemId = null;
	_homeItemName = "";
	_homeItemId = null;
	_fieldItemName = "";
	_fieldItemId = null;
	_templateName = "";
	_templateId = null;
	_customFields = [];
	_parentItemSuggestions = [];
	_homeItemSuggestions = [];
	_fieldItemSuggestions = [];
	_templateSuggestions = [];
	_selectedImage = null;
	_placeholder = "Search for item...";
}

export function partialResetFields() {
	_name = "";
	_selectedImage = null;
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

export async function handleParentItemFocus() {
	if (!_parentItemName) {
		_parentItemSuggestions = await loadRecentItems("item");
	}
}

export async function handleHomeItemFocus() {
	if (!_homeItemName) {
		_homeItemSuggestions = await loadRecentItems("item");
	}
}

export async function handleTemplateFocus() {
	if (!_templateName) {
		_templateSuggestions = await loadRecentItems("template");
	}
}

export async function handleCustomFieldFocus(index: number) {
	if (!_customFields[index].fieldName) {
		_customFields[index].suggestions =
            await loadRecentItems("customField");
	}
}

export async function handleFieldItemFocus() {
	if (!_fieldItemName) {
		_fieldItemSuggestions = await loadRecentItems("item");
	}
}

export function handleFieldItemInput(event: Event) {
	const target = event.target as HTMLInputElement;
	_fieldItemName = target.value;
	_fieldItemId = null;
	if (debounceTimeout) clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		searchFieldItems(_fieldItemName);
	}, 300);
}

export function handleParentItemInput(event: Event) {
	const target = event.target as HTMLInputElement;
	_parentItemName = target.value;
	_parentItemId = null;
	if (debounceTimeout) clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		searchParentItems(_parentItemName);
	}, 300);
}

export function handleHomeItemInput(event: Event) {
	const target = event.target as HTMLInputElement;
	_homeItemName = target.value;
	_homeItemId = null;
	if (debounceTimeout) clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		searchHomeItems(_homeItemName);
	}, 300);
}

export function handleTemplateInput(event: Event) {
	const target = event.target as HTMLInputElement;
	_templateName = target.value;
	_templateId = null;
	if (debounceTimeout) clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		searchTemplates(_templateName);
	}, 300);
}

export function onCustomFieldNameInput(index: number, event: Event) {
	const target = event.target as HTMLInputElement;
	_customFields[index].fieldName = target.value;
	_customFields[index].fieldId = undefined;
	_customFields[index].isNew = true;
	_customFields[index].isExisting = false;
	searchForCustomFields(index);
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
		_parentItemSuggestions = data;
	} catch (err) {
		console.error("Error searching parent items:", err);
	}
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
		_homeItemSuggestions = data;
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
		_fieldItemSuggestions = data;
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
		_templateSuggestions = data;

		//Check for an exact match
		const exactMatch = data.find(
			(template: { name: string }) => template.name === _templateName,
		);

		if (exactMatch) {
			if (_templateId !== exactMatch._id) {
				_templateId = exactMatch._id;
				await loadTemplateFields(_templateId);
			}
		} else {
			_templateId = null;
			removeTemplateFields();
		}
	} catch (err) {
		console.error("Error searching templates:", err);
	}
}

function searchForCustomFields(index: number) {
	if (_customFields[index].searchTimeout)
		clearTimeout(_customFields[index].searchTimeout);

	_customFields[index].searchTimeout = setTimeout(async () => {
		const query = _customFields[index].fieldName.trim();
		if (query.length === 0) {
			_customFields[index].suggestions = [];
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
			_customFields[index].suggestions = data;
		} catch (error) {
			console.error("Error searching custom fields:", error);
		}
	}, 300);
}
    	export function selectParentItem(item: { name: string; _id: string | null }) {
	_parentItemName = item.name;
	_parentItemId = item._id;
	_parentItemSuggestions = [];
	if (item && item._id) {
		addToRecents("item", item);
	}
}

export function selectHomeItem(item: { name: string; _id: string | null }) {
	_homeItemName = item.name;
	_homeItemId = item._id;
	_homeItemSuggestions = [];
	if (item && item._id) {
		addToRecents("item", item);
	}
}

export function selectTemplate(item: { name: string; _id: string }) {
	_templateName = item.name;
	_templateId = item._id;
	_templateSuggestions = [];
	loadTemplateFields(_templateId);
	if (item && item._id) {
		addToRecents("template", item);
	}
}

export function selectCustomFieldSuggestion(
	index: number,
	suggestion: ICustomField,
) {
	_customFields[index].fieldName = suggestion.fieldName;
	_customFields[index].fieldId = suggestion._id;
	_customFields[index].dataType = suggestion.dataType;
	_customFields[index].isNew = false;
	_customFields[index].isExisting = true;
	_customFields[index].suggestions = [];
	if (suggestion && suggestion._id) {
		addToRecents("customField", suggestion);
	}
}

async function loadTemplateFields(templateId: string | null) {
	if (!templateId) return;

	try {
		if (!_templateName || _templateName.trim() === "") {
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

		if (!data || !data.fields) {
			console.warn("No fields found in template:", data);
			return;
		}

		//Remove existing template fields before loading new ones
		removeTemplateFields();

		//Add the template fields
		const templateFields = await Promise.all(
			data.fields.map(async (field: { _id: string }) => {
				const fieldId = field._id;
				const fieldUrl = `/api/customFields/${fieldId}`;

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

		//display template fields before any user-defined fields
		_customFields = [...templateFields, ..._customFields];
	} catch (err) {
		console.error("Error loading template fields:", err);
	}
}

function removeTemplateFields() {
	_customFields = _customFields.filter((f) => !f.fromTemplate);
}

export function addCustomFieldLine() {
	_customFields = [
		..._customFields,
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

export function removeCustomField(index: number) {
	// Only allow removing if not from template
	if (_customFields[index].fromTemplate) return;
	_customFields = _customFields.filter((_, i) => i !== index);
}

export function handleImageChange(event: CustomEvent) {
	const { selectedImage: newImage } = event.detail;
	_selectedImage = newImage;
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

export async function checkIfItemExists(itemName: string) {
	if (itemName.trim() === "") return false;
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