// import { readCSVasJSON } from "./readCSV";

// readCSVasJSON("../data/MilanoData.csv");
// import fs from 'fs';

const suitableHeaders = {
    id: ['id', 'userid'],
    datetime: ['datetime', 'date', 'time'],
    lat: ['lat', 'latitude'],
    lon: ['lon', 'longitude'],
};

interface LooseObject {
    [key: string]: any;
}

function readCSVasJSON(filePath: string): Object[] {
    // const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileContent = '';
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

//-----------------Trajectory-----------------//
interface Movement {
    lat: number;
    lon: number;
    datetime: Date;
}
interface Trajectory {
    id: string;
    movements: Movement[];
}

function createTrajectoriesFromCSV(csv: Object[], isSorted: boolean = true): Record<string, Trajectory> {
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

interface CharacteristicPointParams {
    minAngle: number; //the minimum angle between the directions of consecutive trajectory segments to be considered as a significant turn;
    minStopDuration: number; // the minimum time spent in approximately the same position to be treated as a significant stop;
    minDistance: number; // when the distance between two consecutive points is below this value, the points are treated as approximately the same position;
    maxDistance: number; // the maximum allowed distance between consecutive characteristic points extracted from the trajectory (i.e., if the trajectory has a straight segment with the length more than this value, representative points must be taken such that the distances between them do not exceed this value).}
}

function spatialDistanceMov(p1: Movement, p2: Movement): number {
    return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2));
}

function spatialDistancePoint(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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

function computeAverageMov(movs: Movement[], start: number, end: number): Movement {
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

function ComputeAveragePoint(points: Point[]): Point {
    let x = 0;
    let y = 0;
    for (let i = 0; i < points.length; i++) {
        x += points[i].x;
        y += points[i].y;
    }
    x /= points.length;
    y /= points.length;
    return { x, y };
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

        let dSpace = spatialDistanceMov(trajectory.movements[i], trajectory.movements[j]);
        if (dSpace >= params.maxDistance) {
            C.push(trajectory.movements[j]);
            i = j;
            continue;
        }

        let k = j + 1;
        while (k < n) {
            dSpace = spatialDistanceMov(trajectory.movements[j], trajectory.movements[k]);
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
                        let avg = computeAverageMov(trajectory.movements, j, k);

                        let m = j;
                        let d = spatialDistanceMov(trajectory.movements[m], avg);
                        for (let p = j; p < k; p++) {
                            if (spatialDistanceMov(trajectory.movements[p], avg) > d) {
                                m = p;
                                d = spatialDistanceMov(trajectory.movements[p], avg);
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

function extractCharisticPointsFromAllTrajectories(trajectories: Record<string, Trajectory>): Record<string, Movement[]> {
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

//-----------------Grouping-----------------//
interface Point {
    x: number;
    y: number;
}

interface BoundingBox {
    min: Point;
    max: Point;
}

interface Group {
    members: Point[];
    center: Point;
    meanDist: number;
    density: number;
    medianPoint: Point;
}

interface GridCell {
    value: Point | undefined;
}

interface Grid {
    boundingBox: BoundingBox;
    cellSize: number;
    grid: GridCell[][];
    gridSizeX: number;
    gridSizeY: number;
}

function putInProperGroup(point: Point, set: Group[], grid: Grid) {
    let c = getClosestCentroid(point, grid);
    let newCenter;
    if (c == null) {
        let newGroup: Group = { members: [point], center: point, meanDist: -1, density: -1, medianPoint: { x: -1, y: -1 } };
        set.push(newGroup);
        newCenter = point;
    } else {
        let currGroup: Group = set.filter(group => group.center == c)[0];
        currGroup.members.push(point);
        grid.grid.filter(row => row.filter(cell => cell.value == c))[0][0].value = undefined;
        newCenter = ComputeAveragePoint(currGroup.members);
        currGroup.center = newCenter;
    }

    let gridPos = getGridPosition(newCenter, grid);
    grid.grid[gridPos.x][gridPos.y].value = newCenter;
}

function getClosestCentroid(point: Point, grid: Grid): Point | null {
    let gridPos = getGridPosition(point, grid);
    let i = gridPos.x;
    let j = gridPos.y;

    let C: Point[] = [];

    for (let k = Math.max(i - 1, 1); Math.min(i + 1, grid.gridSizeX); k++) {
        for (let m = Math.max(j - 1, 1); Math.min(j + 1, grid.gridSizeY); m++) {
            let c = grid.grid[k][m].value;
            if (c == undefined) {
                continue;
            }
            if (spatialDistancePoint(point, c) <= grid.cellSize) {
                C.push(c);
            }
        }
    }

    if (C.length == 0) {
        return null;
    } else if (C.length == 1) {
        return C[0];
    } else {
        let minDist = spatialDistancePoint(point, C[0]);
        let closest = C[0];
        for (let c of C) {
            let d = spatialDistancePoint(point, c);
            if (d < minDist) {
                minDist = d;
                closest = c;
            }
        }
        return closest;
    }
}

function getGridPosition(point: Point, grid: Grid): Point {
    let x = Math.floor((point.x - grid.boundingBox.min.x) / grid.cellSize);
    let y = Math.floor((point.y - grid.boundingBox.min.y) / grid.cellSize);
    return { x, y };
}

function redistributePoints(points: Point[], set: Group[], grid: Grid) {
    grid.grid.forEach(row => {
        row.forEach(cell => {
            cell.value = undefined;
        });
    });

    for (let p of points) {
        let c = getClosestCentroid(p, grid);
        let currGroup = set.filter(group => group.center == c)[0];
        currGroup.members.push(p);
    }
}

function movementToPoints(movements: Movement[]): Point[] {
    return movements.map(movement => {
        return { x: movement.lat, y: movement.lon };
    });
}

function extractMovementIntoOneArray(characteristicPoints: Record<string, Movement[]>): Movement[] {
    let movements: Movement[] = [];
    for (const key in characteristicPoints) {
        if (characteristicPoints.hasOwnProperty(key)) {
            movements = movements.concat(characteristicPoints[key]);
        }
    }
    return movements;
}

function groupingCharacteristicPointsInSpace(points: Point[], maxRadius: number): any {
    let bb: BoundingBox = { min: points[0], max: points[0] };
    for (let i = 0; i < points.length; i++) {
        if (points[i].x < bb.min.x) {
            bb.min.x = points[i].x;
        }
        if (points[i].x > bb.max.x) {
            bb.max.x = points[i].x;
        }

        if (points[i].y < bb.min.y) {
            bb.min.y = points[i].y;
        }
        if (points[i].y > bb.max.y) {
            bb.max.y = points[i].y;
        }
    }

    let gridSizeX = Math.ceil((bb.max.x - bb.min.x) / maxRadius);
    let gridSizeY = Math.ceil((bb.max.y - bb.min.y) / maxRadius);
    let gridcells: GridCell[][] = [];

    for (let i = 0; i < gridSizeX; i++) {
        gridcells[i] = [];
        for (let j = 0; j < gridSizeY; j++) {
            gridcells[i][j] = { value: undefined };
        }
    }

    let R: Group[] = [];

    let grid: Grid = { boundingBox: bb, cellSize: maxRadius, gridSizeX, gridSizeY, grid: gridcells };

    for (let i = 0; i < points.length; i++) {
        putInProperGroup(points[i], R, grid);
    }

    redistributePoints(points, R, grid);

    return [R, grid];
}

//-----------------Optimization-----------------//
function getMedianValue(values: number[]): number {
    values.sort((a, b) => a - b);
    let n = values.length;
    if (n % 2 == 0) {
        return (values[n / 2 - 1] + values[n / 2]) / 2;
    } else {
        return values[Math.floor(n / 2)];
    }
}

function getMeanDistance(points: Point[], center: Point): number {
    let sum = 0;
    for (let p of points) {
        sum += spatialDistancePoint(p, center);
    }
    return sum / points.length;
}

function optimizeGroupsInRespectToPointDensity(points: Point[], groups: Group[], grid: Grid) {
    for (let i = 0; i < grid.grid.length; i++) {
        for (let j = 0; j < grid.grid[0].length; j++) {
            grid.grid[i][j] = { value: undefined };
        }
    }

    for (let g of groups) {
        g.medianPoint = {
            x: getMedianValue(g.members.map(m => m.x)),
            y: getMedianValue(g.members.map(m => m.y)),
        };

        g.meanDist = getMeanDistance(g.members, g.medianPoint);
        g.density = g.members.length / g.meanDist ** 2;
    }

    let mDens = getMedianValue(groups.map(g => g.density));

    let orderdGroupsByDensity = groups.sort((a, b) => b.density - a.density);

    let newGroups: Group[] = [];

    for (let i = 0; i < groups.length; i++) {
        const currGroup = groups[i];
        if (groups[i].density < mDens) {
            break;
        }

        let minDist = spatialDistancePoint(currGroup.members[0], currGroup.medianPoint);
        let pMed = currGroup.members[0];
        for (let c of currGroup.members) {
            let d = spatialDistancePoint(c, currGroup.medianPoint);
            if (d < minDist) {
                minDist = d;
                pMed = c;
            }
        }

        let newGroup: Group = { members: [], center: pMed, meanDist: -1, density: -1, medianPoint: { x: -1, y: -1 } };
        newGroups.push(newGroup);

        let gridPos = getGridPosition(pMed, grid);
        grid.grid[gridPos.x][gridPos.y].value = pMed;
    }

    for (let i = 0; i < groups.length; i++) {
        let g = orderdGroupsByDensity[i];
        for (let p of g.members) {
            putInProperGroup(p, newGroups, grid);
        }
    }
    redistributePoints(points, newGroups, grid);

    return newGroups;
}

const csv = readCSVasJSON('./data/MilanoData.csv');
const trajectories = createTrajectoriesFromCSV(csv);
const characteristicPoints = extractCharisticPointsFromAllTrajectories(trajectories);
const movements = extractMovementIntoOneArray(characteristicPoints);
const groupedOutput = groupingCharacteristicPointsInSpace(movementToPoints(movements), 0.0001);
const Groups = groupedOutput[0];
const Grid = groupedOutput[1];
const optimizedGroups = optimizeGroupsInRespectToPointDensity(movementToPoints(movements), Groups, Grid);
