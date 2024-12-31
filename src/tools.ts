import { Movement, Point } from './interfaces';

export function movementToPoints(movements: Movement[]): Point[] {
    return movements.map(movement => {
        return { x: movement.lat, y: movement.lon };
    });
}

export function movementToPoint(movement: Movement): Point {
    return { x: movement.lat, y: movement.lon };
}

export function extractMovementIntoOneArray(characteristicPoints: Record<string, Movement[]>): Movement[] {
    let movements: Movement[] = [];
    for (const key in characteristicPoints) {
        if (characteristicPoints.hasOwnProperty(key)) {
            movements = movements.concat(characteristicPoints[key]);
        }
    }
    return movements;
}
