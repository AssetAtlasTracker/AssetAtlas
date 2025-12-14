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
    suggestions: ICustomField[];
    isNew: boolean;
    isSearching: boolean;
    isExisting: boolean;
    searchTimeout?: ReturnType<typeof setTimeout>;
}

export interface ICustomFieldEntryInstance extends ICustomFieldEntry {
    value: string;
    fromTemplate: boolean;
}