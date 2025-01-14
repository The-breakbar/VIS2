import { Group, Grid, Point, VoronoiCell } from './../interfaces';
import { spatialDistance } from './groupCharacteristicPoints';

function addExtraPoints(centers: Point[], grid: Grid): Point[] {
	const cellSize = grid.cellSize / 111000; // From meters to degrees approx

	const start: Point = { x: grid.boundingBox.min.x - cellSize * 3, y: grid.boundingBox.min.y - cellSize * 3 };
	const end: Point = { x: grid.boundingBox.max.x + cellSize * 3, y: grid.boundingBox.max.y + cellSize * 3 };

	const voronoiPoints: Point[] = [];
	for (let x = start.x; x <= end.x; x += cellSize) {
		for (let y = start.y; y <= end.y; y += cellSize) {
			const point: Point = { x, y };
			if (!checkIfRealCentroidIsNerby(centers, point, grid.cellSize)) {
				voronoiPoints.push(point);
			}
		}
	}

	return voronoiPoints;
}

function checkIfRealCentroidIsNerby(centers: Point[], point: Point, minDistance: number): boolean {
	for (let center of centers) {
		if (spatialDistance(center, point) < minDistance * 2) {
			return true;
		}
	}
	return false;
}

export function getVoronoiPoints(groups: Group[], grid: Grid, paddingPoints: boolean = true): VoronoiCell[] {
	const voronoiPoints = groups.map((group: Group) => {
		return group.center;
	});

	if (paddingPoints) {
		const extraPoints = addExtraPoints(voronoiPoints, grid);
		voronoiPoints.push(...extraPoints);
	}

	return voronoiPoints.map((point: Point, idx: number) => {
		return { id: idx, center: point, entryPoint: { x: -1, y: -1 }, exitPoint: { x: -1, y: -1 }, points: [] as Point[] };
	});
}
