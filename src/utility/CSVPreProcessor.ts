export class CSVPreProcessor {
    static preprocess(data: String[][]) : String[][] {
        let trimmed = data.map(row => row.map(ele => ele.trim().toLowerCase()));
        return trimmed;
    }

    static split(input: String) : String[][] {
        return input.split(/\n|\r/).filter(line => line !== "").map(line => line.split(","));
    }

    static getColumns(input: String) : String[] {
        return this.preprocess(this.split(input))[0];
    }
}