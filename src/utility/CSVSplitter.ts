export class CSVSplitter {
    static split(input: String) : String[][] {
        return input.split(/\n|\r/).filter(line => line !== "").map(line => line.split(","));
    }
}