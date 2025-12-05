import type { IBasicItem } from "$lib/server/db/models/basicItem.js";
import type { ITemplate } from "$lib/server/db/models/template.js";

export interface Parser {
    parse(input:string) : void;

    canParse(columns: string[]) : boolean;

    getEntitiesToAdd() : ITemplate[] | IBasicItem[]
}