import { Movement, Trajectory } from '../interfaces';

export function createTrajectoriesFromCSV(csv: Object[], isSorted: boolean = true): Map<string, Trajectory> {
	const trajectoryMap = new Map<string, Trajectory>();

	csv.forEach((row: any) => {
		let newMov: Movement = {
			lat: parseFloat(row.lat),
			lon: parseFloat(row.lon),
			datetime: new Date(row.datetime)
		};

		if (trajectoryMap.has(row.id)) {
			let currTraj = trajectoryMap.get(row.id) as Trajectory;
			if (isSorted) {
				currTraj.movements.push(newMov);
			} else {
				for (let i = 0; i < currTraj.movements.length; i++) {
					if (newMov.datetime < currTraj.movements[i].datetime) {
						currTraj.movements.splice(i, 0, newMov);
						break;
					}
				}
			}
		} else {
			trajectoryMap.set(row.id, { id: row.id, movements: [newMov] });
		}
	});

	return trajectoryMap;
}
