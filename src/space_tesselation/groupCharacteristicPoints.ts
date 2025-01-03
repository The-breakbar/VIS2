import { Point, Group, Grid, GridCell, BoundingBox, Movement } from '../interfaces';

export function spatialDistance(p1: Point, p2: Point): number {
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function computeAverage(points: Point[]): Point {
	let x = 0;
	let y = 0;
	for (let p of points) {
		x += p.x;
		y += p.y;
	}
	x /= points.length;
	y /= points.length;
	return { x, y } as Point;
}

function putInProperGroup(point: Point, set: Group[], grid: Grid) {
	let c = getClosestCentroid(point, grid);
	let newCenter;
	if (c == null) {
		let newGroup: Group = { id: set.length, members: [point], center: point, meanDist: -1, density: -1, medianPoint: { x: -1, y: -1 } };
		set.push(newGroup);
		newCenter = point;
		newCenter.groupId = set.length - 1;
	} else {
		// let currGroup: Group = set.filter((group) => group.center == c)[0];
		let currGroup = set[c.groupId as number];
		currGroup.members.push(point);
		let tmp = getGridPosition(c, grid);
		grid.grid[tmp.x][tmp.y].value = undefined;
		newCenter = computeAverage(currGroup.members);
		currGroup.center = newCenter;
		currGroup.center.groupId = c.groupId;
	}

	let gridPos = getGridPosition(newCenter, grid);
	grid.grid[gridPos.x][gridPos.y].value = newCenter;
}

function getClosestCentroid(point: Point, grid: Grid): Point | null {
	let gridPos = getGridPosition(point, grid);
	let i = gridPos.x;
	let j = gridPos.y;

	let C: Point[] = [];

	for (let k = Math.max(i - 1, 1); k < Math.min(i + 1, grid.gridSizeX); k++) {
		for (let m = Math.max(j - 1, 1); m < Math.min(j + 1, grid.gridSizeY); m++) {
			if (typeof grid.grid[k][m].value === 'undefined') {
				continue;
			}
			if (spatialDistance(point, grid.grid[k][m].value as Point) <= grid.cellSize) {
				C.push(grid.grid[k][m].value as Point);
			}
		}
	}

	if (C.length == 0) {
		return null;
	} else if (C.length == 1) {
		return C[0];
	} else {
		let minDist = spatialDistance(point, C[0]);
		let closest = C[0];
		for (let c of C) {
			let d = spatialDistance(point, c);
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
	return { x, y } as Point;
}

function redistributePoints(points: Point[], set: Group[], grid: Grid) {
	set.forEach((group) => (group.members = []));

	for (let p of points) {
		let c = getClosestCentroid(p, grid);
		if (c == null) {
			continue;
		}
		let currGroup = set[c.groupId as number];
		currGroup.members.push(p);
	}
}

export function groupingCharacteristicPointsInSpace(points: Point[], maxRadius: number): any {
	let bb: BoundingBox = { min: { x: points[0].x, y: points[0].y }, max: { x: points[0].x, y: points[0].y } };
	for (let i = 0; i < points.length; i++) {
		if (points[i].x < bb.min.x) {
			bb.min.x = points[i].x;
		} else if (points[i].x > bb.max.x) {
			bb.max.x = points[i].x;
		}

		if (points[i].y < bb.min.y) {
			bb.min.y = points[i].y;
		} else if (points[i].y > bb.max.y) {
			bb.max.y = points[i].y;
		}
	}

	let gridSizeX = Math.ceil((bb.max.x - bb.min.x) / maxRadius);
	let gridSizeY = Math.ceil((bb.max.y - bb.min.y) / maxRadius);

	console.log(bb);
	console.log(gridSizeX, gridSizeY);

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
		sum += spatialDistance(p, center);
	}
	return sum / points.length;
}

export function optimizeGroupsInRespectToPointDensity(points: Point[], groups: Group[], grid: Grid) {
	for (let i = 0; i < grid.grid.length; i++) {
		for (let j = 0; j < grid.grid[0].length; j++) {
			grid.grid[i][j] = { value: undefined };
		}
	}

	for (let g of groups) {
		g.medianPoint = {
			x: getMedianValue(g.members.map((m) => m.x)),
			y: getMedianValue(g.members.map((m) => m.y))
		};

		g.meanDist = getMeanDistance(g.members, g.medianPoint);
		g.density = g.members.length / g.meanDist ** 2;
	}

	let mDens = getMedianValue(groups.map((g) => g.density));

	let orderdGroupsByDensity = groups.sort((a, b) => b.density - a.density);

	let newGroups: Group[] = [];
	let counter = 0;
	for (let i = 0; i < groups.length; i++) {
		const currGroup = groups[i];
		if (currGroup.members.length == 0) {
			continue;
		}

		if (groups[i].density < mDens) {
			break;
		}
		// console.log(currGroup);
		let minDist = spatialDistance(currGroup.members[0], currGroup.medianPoint);
		let pMed = currGroup.members[0];
		for (let c of currGroup.members) {
			let d = spatialDistance(c, currGroup.medianPoint);
			if (d < minDist) {
				minDist = d;
				pMed = c;
			}
		}
		pMed.groupId = counter;

		let newGroup: Group = { id: counter, members: [], center: pMed, meanDist: -1, density: -1, medianPoint: { x: -1, y: -1 } };
		newGroups.push(newGroup);

		let gridPos = getGridPosition(pMed, grid);
		grid.grid[gridPos.x][gridPos.y].value = pMed;
		counter++;
	}

	for (let i = 0; i < orderdGroupsByDensity.length; i++) {
		let g = orderdGroupsByDensity[i];
		if (typeof g.members === 'undefined' || g.members.length == 0) {
			continue;
		}
		for (let p of g.members) {
			putInProperGroup(p, newGroups, grid);
		}
	}
	redistributePoints(points, newGroups, grid);

	return newGroups;
}
