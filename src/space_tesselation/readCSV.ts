import { LooseObject } from '../interfaces';

import { readFileSync } from 'fs';

const suitableHeaders = {
    id: ['id', 'userid'],
    datetime: ['datetime', 'date', 'time'],
    lat: ['lat', 'latitude'],
    lon: ['lon', 'longitude'],
};

export function readCSVasJSON(filePath: string): Object[] {
    const fileContent = readFileSync(filePath, 'utf8');
    const rows = fileContent.split('\n');
    const headers = rows[0].split(',');
    const data = rows.slice(1).map((row: string) => {
        const values = row.split(',');
        const obj: LooseObject = {};
        headers.forEach((header: string, index: number) => {
            let currVal = values[index].replace(/["\r]/g, '');
            if (suitableHeaders.id.includes(header)) {
                obj.id = currVal;
            } else if (suitableHeaders.datetime.includes(header)) {
                obj.datetime = currVal;
            } else if (suitableHeaders.lat.includes(header)) {
                obj.lat = currVal;
            } else if (suitableHeaders.lon.includes(header)) {
                obj.lon = currVal;
            } else {
                obj[header] = currVal;
            }
        });
        return obj;
    });
    return data;
}
