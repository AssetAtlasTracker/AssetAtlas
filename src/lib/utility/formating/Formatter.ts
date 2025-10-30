import type { Types } from "mongoose";
import type { IBasicItem } from "../../models/basicItem.js";
import type { ITemplate } from "../../models/template.js";
import type { ICustomField } from "../../models/customField.js";

export interface Formatter {
    formatTemplates(templates: ITemplate[]) : string

    formatItems(itemTree: IBasicItem[], itemMap: Map<Types.ObjectId, IBasicItem>, customFieldMap: Map<Types.ObjectId, ICustomField>) : string
}