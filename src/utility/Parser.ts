export interface Parser {
    parse(input:String) : void;

    canParse(columns: String[]) : boolean;
}