import { get, writable } from 'svelte/store';
import { actionStore } from "../stores/actionStore.js";
import { createEventDispatcher } from 'svelte';

export interface ICustomField {
  _id: string;
  fieldName: string;
  dataType: string;
  createdAt: string;
}

export interface ICustomFieldEntry {
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

export interface ItemInfoStore {
  name: string;
  description: string;
  tags: string;
  parentItemName: string;
  parentItemId: string | null;
  sameLocations: boolean;
  parentItemSuggestions: any[];
  homeItemName: string;
  homeItemId: string | null;
  homeItemSuggestions: any[];
  templateName: string;
  templateId: string | null;
  templateSuggestions: any[];
  debounceTimeout: ReturnType<typeof setTimeout> | undefined;
  selectedImage: File | null;
  removeExistingImage: boolean;
  customFields: ICustomFieldEntry[];
  dialog: HTMLDialogElement | null;
}

export const createItemStore = createStore();

function createStore() {
  const initialState: ItemInfoStore = {
    name: "",
    description: "",
    tags: "",
    parentItemName: "",
    parentItemId: null,
    sameLocations: true,
    parentItemSuggestions: [],
    homeItemName: "",
    homeItemId: null,
    homeItemSuggestions: [],
    templateName: "",
    templateId: null,
    templateSuggestions: [],
    debounceTimeout: undefined,
    selectedImage: null,
    removeExistingImage: false,
    customFields: [],
    dialog: null
  };

  const { subscribe, set, update } = writable<ItemInfoStore>(initialState);

  return {
    subscribe,
    set,
    update,
    handleCreateItem,
    handleImageChange,
    handleParentItemInput,
    resetForm,
  };
}

async function handleCreateItem() {
  const itemStore = get(createItemStore);
  const dispatch = createEventDispatcher();

    try {
      //If a template name is typed but not an exact match (no templateId set), block creation
      if (itemStore.templateName.trim() && !itemStore.templateId) {
        alert(
          "Please select a valid template from the list or clear the field.",
        );
        return;
      }

      const tagsArray = itemStore.tags.split(",").map((tag) => tag.trim());

      if (itemStore.sameLocations) {
        createItemStore.update((current) => ({
          ...current,
          parentItemId: itemStore.homeItemId,
          parentItemName: itemStore.homeItemName,
        }));
      }

      //Filter out empty fields not from the template
      itemStore.customFields = itemStore.customFields.filter((field) => {
        if (field.fromTemplate) return true; //Always keep template fields that were loaded
          return field.fieldName.trim() !== "" && field.dataType.trim() !== "";
      });

      const formattedCustomFields = await Promise.all(
        itemStore.customFields.map(async (field) => {
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
      formData.append("name", itemStore.name);
      formData.append("description", itemStore.description);
      formData.append("tags", JSON.stringify(tagsArray));
      if (itemStore.parentItemId) formData.append("parentItem", itemStore.parentItemId);
      if (itemStore.homeItemId) formData.append("homeItem", itemStore.homeItemId);
      if (itemStore.templateId) formData.append("template", itemStore.templateId);
      formData.append("customFields", JSON.stringify(formattedCustomFields));
      if (itemStore.selectedImage) formData.append("image", itemStore.selectedImage);

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
      itemStore.dialog?.close();
      dispatch('itemCreated'); //triggers action display stuff

      //Reset the form after successful creation
      resetForm();
    } catch (err) {
      console.error("Error creating item:", err);
      actionStore.addMessage("Error creating item");
    }
  }

function handleImageChange(event: CustomEvent) {
  const { selectedImage: newImage, removeExistingImage: remove } =
    event.detail;

  createItemStore.update((current) => ({
    ...current,
    selectedImage: newImage,
    removeExistingImage: remove
  }));
}

function handleParentItemInput(event: Event) {
  const target = event.target as HTMLInputElement;
  createItemStore.update((current) => {
    current.parentItemName = target.value;
    current.parentItemId = null;
    if (current.debounceTimeout) clearTimeout(current.debounceTimeout);
    current.debounceTimeout = setTimeout(() => {
      searchParentItems(current.parentItemName);
    }, 300);
    return current;
  });
}

async function searchParentItems(query: string) {
  const itemStore = get(createItemStore);
  try {
    const response = await fetch(
      `/api/items/search?name=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const data = await response.json();
    itemStore.parentItemSuggestions = data;
  } catch (err) {
    console.error("Error searching parent items:", err);
  }
}

async function handleParentItemFocus() {
  const itemStore = get(createItemStore);
  let recentItems: any[];
  if (!itemStore.parentItemName) {
    recentItems = await loadRecentItems("items");
    createItemStore.update((current) => {
      current.parentItemSuggestions = recentItems;
      return current;
    });
  }
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

function resetForm() {
  createItemStore.update(current => ({
    ...current,
    name: "",
    description: "",
    tags: "",
    parentItemName: "",
    parentItemId: null,
    parentItemSuggestions: [],
    homeItemName: "",
    homeItemId: null,
    homeItemSuggestions: [],
    templateName: "",
    templateID: null,
    templateSuggestions: [],
    customFields: [],
    selectedImage: null,
    removeExistingImage: false
  }));
}