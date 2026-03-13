import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem";
import { actionStore } from "$lib/stores/actionStore";
import type { ICustomField, ICustomFieldEntryInstance } from "$lib/types/customField";
import { uploadImage } from '$lib/utility/imageUpload.js';
import { addToRecents } from "$lib/utility/recentItemHelper";

type ISelectedTemplate = {
	_id: string;
	name: string;
};

let item = $state<IBasicItemPopulated | null>(null);
let duplicate = $state(false);

let _name = $state("");
let _description = $state("");
let _tags = $state("");
let _parentItemName = $state("");
let _parentItemId = $state<string | null>(null);
let _sameLocations = $state(true);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _parentItemSuggestions = $state<any[]>([]);
let _homeItemName = $state("");
let _homeItemId = $state<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _homeItemSuggestions = $state<any[]>([]);
let _fieldItemName = $state("");
let _fieldItemId = $state<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _fieldItemSuggestions = $state<any[]>([]);
let _templateName = $state("");
let _templateId = $state<string | null>(null);
let _selectedTemplates = $state<ISelectedTemplate[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	get selectedTemplates() { return _selectedTemplates; },
	set selectedTemplates(v) { _selectedTemplates = v; },
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
		if (_selectedTemplates.length > 0) {
			formData.append(
				"templates",
				JSON.stringify(_selectedTemplates.map((template) => ({ field: template._id }))),
			);
		}
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

		return true;
	} catch (err) {
		console.error("Error creating item:", err);
		actionStore.addMessage("Error creating item");
		return false;
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
		_selectedTemplates = (item.templates ?? [])
			.map((template) => ({
				_id: template.field?._id?.toString(),
				name: template.field?.name,
			}))
			.filter((template) => !!template._id && !!template.name) as ISelectedTemplate[];
		_templateName = "";
		_templateId = null;

		if (item.customFields?.length) {
			const templateFieldIds = getTemplateFieldIdSet(item);

			const mappedFields = item.customFields.map((cf) => ({
				fieldName: cf.field.fieldName,
				fieldId: cf.field._id as unknown as string,
				dataType: cf.field.dataType,
				displayValue: cf.field.dataType === "item" ? (cf.value as IBasicItemPopulated)?.name || "" : cf.value as string,
				value: cf.value as string,
				suggestions: [],
				isNew: false,
				isSearching: false,
				isExisting: true,
				fromTemplate: templateFieldIds.has((cf.field._id as unknown as string).toString()),
				searchTimeout: undefined,
			}));

			const templateFields = mappedFields.filter((field) => field.fromTemplate);
			const remainingFields = mappedFields.filter((field) => !field.fromTemplate);
			_customFields = [...templateFields, ...remainingFields];
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
			_selectedTemplates = (item.templates ?? [])
				.map((template) => ({
					_id: template.field?._id?.toString(),
					name: template.field?.name,
				}))
				.filter((template) => !!template._id && !!template.name) as ISelectedTemplate[];
			_templateName = "";
			_templateId = null;
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
	_selectedTemplates = [];
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
		_templateSuggestions = await loadAllTemplates();
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
		if (_templateName.trim() === "") {
			loadAllTemplates();
		} else {
			searchTemplates(_templateName);
		}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadAllTemplates(): Promise<any[]> {
	try {
		const response = await fetch(`/api/templates`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		return await response.json();
	} catch (err) {
		console.error("Error loading templates:", err);
		return [];
	}
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

		// Check for exact match to help with typed-entry validation
		const exactMatch = data.find(
			(template: { name: string }) => template.name === _templateName,
		);

		if (exactMatch) {
			_templateId = exactMatch._id;
		} else {
			_templateId = null;
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
	const alreadySelected = _selectedTemplates.some((template) => template._id === item._id);
	if (!alreadySelected) {
		_selectedTemplates = [..._selectedTemplates, { _id: item._id, name: item.name }];
		void syncTemplateFields();
	}
	_templateName = "";
	_templateId = null;
	_templateSuggestions = [];
	if (item && item._id) {
		addToRecents("template", item);
	}
}

export function removeSelectedTemplate(templateId: string) {
	_selectedTemplates = _selectedTemplates.filter((template) => template._id !== templateId);
	void syncTemplateFields();
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

async function syncTemplateFields() {
	try {
		const nonTemplateFields = _customFields.filter((field) => !field.fromTemplate);
		if (_selectedTemplates.length === 0) {
			_customFields = nonTemplateFields;
			return;
		}

		const existingTemplateFields = _customFields
			.filter((field) => field.fromTemplate && !!field.fieldId)
			.reduce<Record<string, ICustomFieldEntryInstance>>((acc, field) => {
				if (field.fieldId) {
					acc[String(field.fieldId)] = field;
				}
				return acc;
			}, {});

		const templateResponses = await Promise.all(
			_selectedTemplates.map(async (template) => {
				const response = await fetch(`/api/templates/${template._id}`, {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});
				if (!response.ok) {
					console.error(
						`Failed to fetch template. Status: ${response.status} - ${response.statusText}`,
					);
					console.error(await response.text());
					return [];
				}
				const data = await response.json();
				return Array.isArray(data?.fields) ? data.fields : [];
			}),
		);

		const uniqueFieldIds = Array.from(
			new Set(
				templateResponses
					.flat()
					.map((field: { _id: string }) => field?._id)
					.filter((fieldId: string | undefined) => !!fieldId),
			),
		);

		const templateFields = await Promise.all(
			uniqueFieldIds.map(async (fieldId) => {
				const existingField = existingTemplateFields[fieldId];
				if (existingField) {
					return { ...existingField, fromTemplate: true };
				}

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
					throw new Error(`Failed to fetch field with ID: ${fieldId}`);
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

		_customFields = [...templateFields, ...nonTemplateFields];
	} catch (err) {
		console.error("Error syncing template fields:", err);
	}
}

function getTemplateFieldIdSet(sourceItem: IBasicItemPopulated) {
	const templateFieldIds = new Set<string>();
	for (const template of sourceItem.templates ?? []) {
		for (const field of template.field?.fields ?? []) {
			templateFieldIds.add(
				typeof field === "string" ? field : field._id.toString(),
			);
		}
	}
	return templateFieldIds;
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

export async function checkIfItemExistsById(itemId: string) {
	if(itemId === "") return false;
	try {
		const response = await fetch(
			`/api/customFields/checkItemId?itemID=${itemId}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		);
		const data = await response.json();
		return data.name;
	} catch (err) {
		console.error("Error checking item name:", err);
		return false;
	}
}

export async function submitAndCloseItem(
	dialog: HTMLDialogElement | undefined,
	imageSelector: { resetImage: () => void }
) {
	let success = await handleCreateItem();
	if (success) {
		if (dialog) {
			dialog.close();
		}
		imageSelector.resetImage();
		resetAllFields();
	}
	return success;
}
