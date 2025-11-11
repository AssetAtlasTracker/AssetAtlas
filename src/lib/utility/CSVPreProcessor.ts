export class CSVPreProcessor {
    static preprocess(data: string[][]) : string[][] {
        const trimmed = data.map(row => row.map(ele => ele.trim().toLowerCase()));
        return trimmed;
    }

    static split(input: string) : string[][] {
        return input.split(/\n|\r/).filter(line => line !== "").map(line => line.split(","));
    }

    static getColumns(input: string) : string[] {
        return this.preprocess(this.split(input))[0];
    }
}