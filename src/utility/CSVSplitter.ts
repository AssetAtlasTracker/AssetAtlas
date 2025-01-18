export class CSVSplitter {
    static split(input: string) : string[][] {
        return input.split(/\n|\r/).filter(line => line !== "").map(line => line.split(","));
    }
}