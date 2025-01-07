import { Point, BoundingBox, ScreenSize } from '../interfaces';

// bounding box:
// long: 9.05 - 9.28
// lat: 45.37 - 45.56

function equiRectangularProjection(point: Point, boundingBox: BoundingBox): Point {
	// x = r λ cos(φ0)
	// y = r φ

	const centerLat = (boundingBox.max.y + boundingBox.min.y) / 2;
	const x = point.x * Math.cos(centerLat);
	const y = point.y;

	return { x, y };
}

// scales the data to the screen size with the bounding box
export function scalePointToScreen(point: Point, screenSize: ScreenSize, boundingBox: BoundingBox): Point {
	const projectedPoint = equiRectangularProjection(point, boundingBox);
	const projectedBounds = {
		min: equiRectangularProjection(boundingBox.min, boundingBox),
		max: equiRectangularProjection(boundingBox.max, boundingBox)
	};

	const xDiff = projectedBounds.max.x - projectedBounds.min.x;
	const yDiff = projectedBounds.max.y - projectedBounds.min.y;
	let diagramAspectRatio = xDiff / yDiff;
	let screenAspectRatio = screenSize.width / screenSize.height;

	let normalizedX = (projectedPoint.x - projectedBounds.min.x) / xDiff;
	let normalizedY = (projectedPoint.y - projectedBounds.min.y) / yDiff;

	let x, y;
	if (diagramAspectRatio > screenAspectRatio) {
		// diagram is wider than screen
		const height = screenSize.width / diagramAspectRatio;

		x = normalizedX * screenSize.width;
		y = normalizedY * height + (screenSize.height - height) / 2;
	} else {
		// diagram is taller than screen
		const width = screenSize.height * diagramAspectRatio;

		x = normalizedX * width + (screenSize.width - width) / 2;
		y = normalizedY * screenSize.height;
	}

	return { x, y };
}
