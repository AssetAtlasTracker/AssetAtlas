import type { IBasicItem } from "../../models/basicItem";
import type { ITemplate } from "../../models/template";

export interface Parser {
    parse(input:string) : void;

    canParse(columns: string[]) : boolean;

    getEntitiesToAdd() : ITemplate[] | IBasicItem[]
}