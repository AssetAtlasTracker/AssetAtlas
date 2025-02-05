import type { IBasicItem } from "../../models/basicItem.js";
import type { ITemplate } from "../../models/template.js";

export interface Parser {
    parse(input:string) : void;

    canParse(columns: string[]) : boolean;

    getEntitiesToAdd() : ITemplate[] | IBasicItem[]
}