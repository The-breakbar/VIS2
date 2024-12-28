const suitableHeaders = ["id", "userid", "datetime", "date", "time","lat","lon", "latitude", "longitude"]

export async function readCSVasJSON(filePath: string): Promise<Object[]> {
    const fileContent: string = await fetch(filePath).then((response) => {
        return response.text();
    });

    const rows: string[] = fileContent.split("\n");
    const headers: string[] = rows[0].split(",");

    const data: Object[] = rows.slice(1).map((row: string) => {
        const values: string[] = row.split(",");
        const obj: any = {};
        headers.forEach((header: string, index: number) => {

            if (suitableHeaders.indexOf(header.toLowerCase()) > -1) {   
                obj[header] = values[index];
            }
        });
        return obj;
    });

    console.log(data);
    return data;
}