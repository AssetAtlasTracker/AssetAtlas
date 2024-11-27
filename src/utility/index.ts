import { CSVItemParser } from "./CSVItemParser";
import { CSVTemplateParser } from "./CSVTemplateParser";
import { FileLoader } from "./FileLoader";
import { ParserManager } from "./ParserManager";

export function prod() {
    return ParserManager;
}

export function test() {
    return {itemParser: CSVItemParser, templateParser: CSVTemplateParser, loader: FileLoader};
}