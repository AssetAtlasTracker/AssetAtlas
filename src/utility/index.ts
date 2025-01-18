import { CSVTemplateParser } from "./parsing/CSVTemplateParser";
import { FileLoader } from "./file/FileLoader";
import { ParserManager } from "./parsing/ParserManager";
import { CSVFormatter } from "./formating/CSVFormatter";
import { FileExporter } from "./file/FileExporter";


export function prod() {
    return ParserManager;
}

export function test() {
    return {templateParser: CSVTemplateParser, formatter: CSVFormatter, loader: FileLoader, exporter: FileExporter};
}