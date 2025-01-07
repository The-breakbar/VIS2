import { Movement, Trajectory, CharacteristicPointParams } from '../interfaces';

function spatialDistance(p1: Movement, p2: Movement): number {
	// return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2));
	let lat1 = p1.lat;
	let lon1 = p1.lon;
	let lat2 = p2.lat;
	let lon2 = p2.lon;

	if (lat1 == lat2 && lon1 == lon2) {
		return 0;
	}

	let R = 6378.137; // Radius of earth in KM
	let dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
	let dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
	let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	let d = R * c;
	return d * 1000;
}

function temporalDistance(p1: Movement, p2: Movement): number {
	return Math.abs(p1.datetime.getTime() - p2.datetime.getTime());
}

function angleBetweenVectors(x1: Movement, y1: Movement, x2: Movement, y2: Movement): number {
	let dotProduct = (x1.lat - y1.lat) * (x2.lat - y2.lat) + (x1.lon - y1.lon) * (x2.lon - y2.lon);
	let magnitude1 = Math.sqrt(Math.pow(x1.lat - y1.lat, 2) + Math.pow(x1.lon - y1.lon, 2));
	let magnitude2 = Math.sqrt(Math.pow(x2.lat - y2.lat, 2) + Math.pow(x2.lon - y2.lon, 2));
	return Math.acos(dotProduct / (magnitude1 * magnitude2));
}

function computeAverage(movs: Movement[], start: number, end: number): Movement {
	let lat = 0;
	let lon = 0;
	for (let i = start; i < end; i++) {
		lat += movs[i].lat;
		lon += movs[i].lon;
	}
	lat /= end - start;
	lon /= end - start;
	return { lat, lon, datetime: new Date() };
}

function extractCharacteristicPointsOfATrajectory(trajectory: Trajectory, params: CharacteristicPointParams): Movement[] {
	if (trajectory.movements.length < 2) {
		throw new Error('Trajectory must have at least 2 movements');
	}

	let n = trajectory.movements.length;

	let C: Movement[] = [trajectory.movements[0]]; //Step 1
	let i = 0;
	let j = i + 1; //Step 2

	while (true) {
		let returnToStart: boolean = false; //Step 3
		if (j >= n) break; //END While and go to End of Function

		let dSpace = spatialDistance(trajectory.movements[i], trajectory.movements[j]); //Step 4
		if (dSpace >= params.maxDistance) {
			//Step 5
			C.push(trajectory.movements[j]);
			i = j;
			j = i + 1;
			continue;
		}

		let k = j + 1; //Step 6
		while (k < n) {
			dSpace = spatialDistance(trajectory.movements[j], trajectory.movements[k]);

			if (dSpace >= params.minDistance) {
				if (k > j + 1) {
					//Step 7
					let dTime = temporalDistance(trajectory.movements[k - 1], trajectory.movements[j]);

					if (dTime >= params.minStopDuration) {
						C.push(trajectory.movements[j]);
						i = j;
						j = k;
						returnToStart = true; //Go to Step 3
						break;
					} else {
						let avg = computeAverage(trajectory.movements, j, k);

						let m = j;
						let d = spatialDistance(trajectory.movements[m], avg);
						for (let p = j; p < k; p++) {
							if (spatialDistance(trajectory.movements[p], avg) < d) {
								m = p;
								d = spatialDistance(trajectory.movements[p], avg);
							}
						}
						j = m;
					}
				}

				//Step 8
				let aTurn = angleBetweenVectors(trajectory.movements[i], trajectory.movements[j], trajectory.movements[j], trajectory.movements[k]);
				if (aTurn >= params.minAngle) {
					C.push(trajectory.movements[j]);
					i = j;
					j = k;
				} else {
					j++;
				}
				returnToStart = true; //Go to Step 3
				break;
			}

			k++;
		}

		if (returnToStart) continue; //Go to Step 3

		break;
	}

	C.push(trajectory.movements[n - 1]);
	return C;
}

export function extractCharisticPointsFromAllTrajectories(trajectories: Map<string, Trajectory>, params: CharacteristicPointParams): Map<string, Movement[]> {
	const characteristicPoints = new Map<string, Movement[]>();

	//TODO: FIX adjust params
	for (const [key] of trajectories) {
		if (characteristicPoints.has(key)) throw new Error('Duplicate key in trajectories');
		const traj = trajectories.get(key) as Trajectory;
		if (traj.movements.length >= 2) {
			characteristicPoints.set(key, extractCharacteristicPointsOfATrajectory(traj, params));
		}
	}

	return characteristicPoints;
}
