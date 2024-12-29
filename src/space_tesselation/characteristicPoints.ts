import { Movement, Trajectory, CharacteristicPointParams } from '../interfaces';

function spatialDistance(p1: Movement, p2: Movement): number {
    return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2));
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

    let C: Movement[] = [trajectory.movements[0]];
    let i = 0;

    while (true) {
        let returnToStart: boolean = false;
        let j = i + 1;
        if (j >= n) break;

        let dSpace = spatialDistance(trajectory.movements[i], trajectory.movements[j]);
        if (dSpace >= params.maxDistance) {
            C.push(trajectory.movements[j]);
            i = j;
            continue;
        }

        let k = j + 1;
        while (k < n) {
            dSpace = spatialDistance(trajectory.movements[j], trajectory.movements[k]);
            if (dSpace >= params.minDistance) {
                if (k > j + 1) {
                    let dTime = temporalDistance(trajectory.movements[k - 1], trajectory.movements[j]);

                    if (dTime > params.minStopDuration) {
                        C.push(trajectory.movements[j]);
                        i = j;
                        j = k;
                        returnToStart = true;
                        break;
                    } else {
                        let avg = computeAverage(trajectory.movements, j, k);

                        let m = j;
                        let d = spatialDistance(trajectory.movements[m], avg);
                        for (let p = j; p < k; p++) {
                            if (spatialDistance(trajectory.movements[p], avg) > d) {
                                m = p;
                                d = spatialDistance(trajectory.movements[p], avg);
                            }
                        }
                        j = m;
                    }
                }
                let aTurn = angleBetweenVectors(
                    trajectory.movements[i],
                    trajectory.movements[j],
                    trajectory.movements[j],
                    trajectory.movements[k],
                );
                if (aTurn > params.minAngle) {
                    C.push(trajectory.movements[j]);
                    i = j;
                    j = k;
                } else {
                    j++;
                }
                returnToStart = true;
                break;
            }
            k++;
        }
        if (returnToStart == true) {
            break;
        }
    }

    C.push(trajectory.movements[n - 1]);
    return C;
}

export function extractCharisticPointsFromAllTrajectories(trajectories: Record<string, Trajectory>): Record<string, Movement[]> {
    const characteristicPoints: Record<string, Movement[]> = {};
    const params: CharacteristicPointParams = {
        minAngle: 0.1,
        minStopDuration: 1000,
        minDistance: 0.0001,
        maxDistance: 0.0001,
    };

    for (const key in trajectories) {
        if (trajectories.hasOwnProperty(key)) throw new Error('Duplicate key in trajectories');
        characteristicPoints[key] = extractCharacteristicPointsOfATrajectory(trajectories[key], params);
    }

    return characteristicPoints;
}
