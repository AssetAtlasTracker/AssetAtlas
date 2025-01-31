export function downloadFile(filename: string, data: string) {
    try {
        const blob = new Blob([data], {type: "text/csv;charset=utf-8;"});
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        link.hidden = true;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("Successfully exported file", filename);
        return "Success";
    } catch (err) {
        console.error(err);
        throw new Error("Error while exporting file.");
    }
}