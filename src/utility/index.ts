import { CSVItemParser } from "./parsing/CSVItemParser";
import { CSVTemplateParser } from "./parsing/CSVTemplateParser";
import { FileLoader } from "./file/FileLoader";
import { ParserManager } from "./parsing/ParserManager";

export function prod() {
    return ParserManager;
}

export function test() {
    return {itemParser: CSVItemParser, templateParser: CSVTemplateParser, loader: FileLoader};
}