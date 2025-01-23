import type { IBasicItem } from "../../models/basicItem";
import type { ITemplate } from "../../models/template";

export interface Parser {
    parse(input:String) : void;

    canParse(columns: String[]) : boolean;

    getEntitiesToAdd() : ITemplate[] | IBasicItem[]
}