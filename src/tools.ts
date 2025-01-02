import { Movement, Point } from './interfaces';

export function movementToPoints(movements: Movement[]): Point[] {
	return movements.map((movement) => {
		return { x: movement.lat, y: movement.lon };
	});
}

export function movementToPoint(movement: Movement): Point {
	return { x: movement.lat, y: movement.lon };
}

export function extractMovementIntoOneArray(characteristicPoints: Map<string, Movement[]>): Movement[] {
	let movements: Movement[] = [];
	characteristicPoints.forEach((value, key) => {
		movements = movements.concat(value);
	});
	return movements;
}
