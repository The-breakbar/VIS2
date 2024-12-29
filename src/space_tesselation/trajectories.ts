import { Movement, Trajectory } from '../interfaces';

export function createTrajectoriesFromCSV(csv: Object[], isSorted: boolean = true): Record<string, Trajectory> {
    const trajectoryMap: Record<string, Trajectory> = {};

    csv.forEach((row: any) => {
        let newMov: Movement = {
            lat: parseFloat(row.lat),
            lon: parseFloat(row.lon),
            datetime: new Date(row.datetime),
        };

        if (trajectoryMap[row.id]) {
            if (isSorted) {
                trajectoryMap[row.id].movements.push(newMov);
            } else {
                for (let i = 0; i < trajectoryMap[row.id].movements.length; i++) {
                    if (newMov.datetime < trajectoryMap[row.id].movements[i].datetime) {
                        trajectoryMap[row.id].movements.splice(i, 0, newMov);
                        break;
                    }
                }
            }
        } else {
            trajectoryMap[row.id] = {
                id: row.id,
                movements: [newMov],
            };
        }
    });

    return trajectoryMap;
}
