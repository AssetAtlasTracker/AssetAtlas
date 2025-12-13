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