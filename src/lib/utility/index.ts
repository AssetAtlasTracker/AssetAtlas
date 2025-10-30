import { CSVItemParserPopulated } from "./parsing/CSVItemParserPopulated.js";
import { CSVTemplateParser } from "./parsing/CSVTemplateParser.js";
import { FileLoader } from "./file/FileLoader.js";
import { ParserManager } from "./parsing/ParserManager.js";
import { CSVFormatterPopulated } from "./formating/CSVFormatterPopulated.js";
import { FileExporter } from "./file/FileExporter.js";


export function prod() {
    return ParserManager;
}

export function test() {
    return {itemParser: CSVItemParserPopulated, templateParser: CSVTemplateParser, formatter: CSVFormatterPopulated, loader: FileLoader, exporter: FileExporter};
}