export class CSVPreProcessor {
    static preprocess(data: String[][]) : String[][] {
        let trimmed = data.map(row => row.map(ele => ele.trim().toLowerCase()));
        return trimmed;
    }
}