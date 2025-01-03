import { LooseObject } from '../interfaces';

const suitableHeaders = {
	id: ['id', 'userid'],
	datetime: ['datetime', 'date', 'time'],
	lat: ['lat', 'latitude'],
	lon: ['lon', 'longitude']
};

export async function readCSVasJSON(filePath: string): Promise<Object[]> {
	const fileContent = await fetch(filePath).then((response) => response.text());
	// console.log(fileContent);

	const rows = fileContent.split('\n');
	const headers = rows[0].split(',');
	const data = rows.slice(1).map((row: string) => {
		const values = row.split(',');
		const obj: LooseObject = {};
		headers.forEach((header: string, index: number) => {
			if (!values[index]) {
				console.log(values);
				throw new Error('No value');
			}

			let currVal = values[index].replace(/["\r]/g, '');
			let currHeader = header.replace(/["\r]/g, '');
			if (suitableHeaders.id.includes(currHeader)) {
				obj.id = currVal;
			} else if (suitableHeaders.datetime.includes(currHeader)) {
				obj.datetime = currVal;
			} else if (suitableHeaders.lat.includes(currHeader)) {
				obj.lat = currVal;
			} else if (suitableHeaders.lon.includes(currHeader)) {
				obj.lon = currVal;
			} else {
				obj[currHeader] = currVal;
			}
		});
		return obj;
	});
	return data;
}
