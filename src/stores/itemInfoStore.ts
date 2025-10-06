import { writable } from 'svelte/store';

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
}

export const createItemStore = writable<ItemInfoStore>({
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
  customFields: []
});