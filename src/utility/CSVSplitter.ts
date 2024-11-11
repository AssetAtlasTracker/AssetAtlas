export class CSVSplitter {
    static split(input: String) : String[][] {
        return input.split(/\n|\r/).map(line => line.split(","));
    }
}