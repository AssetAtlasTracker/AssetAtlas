import { CSVItemParserPopulated } from "./parsing/CSVItemParserPopulated";
import { CSVTemplateParser } from "./parsing/CSVTemplateParser";
import { FileLoader } from "./file/FileLoader";
import { ParserManager } from "./parsing/ParserManager";
import { CSVFormatterPopulated } from "./formating/CSVFormatterPopulated";
import { FileExporter } from "./file/FileExporter";


export function prod() {
    return ParserManager;
}

export function test() {
    return {itemParser: CSVItemParserPopulated, templateParser: CSVTemplateParser, formatter: CSVFormatterPopulated, loader: FileLoader, exporter: FileExporter};
}