import * as d3 from 'd3';

import './style.css';

import { loadAndComputeCSV } from './space_tesselation/spaceIndex';
import { reduceDimensions } from './dimReduction';
import { BoundingBox, Point, ScreenSize } from './interfaces';
import { Delaunay } from 'd3';

const screenSize: ScreenSize = {
	width: document.getElementById('voronoi')!.clientWidth,
	height: document.getElementById('voronoi')!.clientHeight
};

const NMF_TOPICS = 21;
const NMF_ITERATIONS = 11;
const TSNE_CONFIG = {
	dim: 2,
	perplexity: 30.0,
	earlyExaggeration: 4.0,
	learningRate: 100.0,
	nIter: 500,
	metric: 'euclidean'
};

const data = await loadAndComputeCSV({
	filePath: './data/SmallMilanoData.csv',
	maxRadius: 2500,
	characteristicPointParams: {
		minAngle: 30, //Degrees
		minStopDuration: 300 * 1000, //Seconds times milliseconds
		minDistance: 250, //Meters
		maxDistance: 2500 //Meters
	}
});

//let visualize = reduceDimensions(data.segementedTrajectories, data.realVornonoiPoints, NMF_TOPICS, NMF_ITERATIONS, TSNE_CONFIG);

function equiRectangularProjection(point: Point, boundingBox: BoundingBox): Point {
	// x = r λ cos(φ0)
	// y = r φ

	const centerLat = (boundingBox.max.y + boundingBox.min.y) / 2;
	const x = point.x * Math.cos(centerLat);
	const y = point.y;

	return { x, y };
}

// scales the data to the screen size with the bounding box
function scalePointToScreen(point: Point, screenSize: ScreenSize, boundingBox: BoundingBox): Point {
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

let svg = d3.select('#voronoi').append('svg').attr('width', screenSize.width).attr('height', screenSize.height);
let lineGroup = svg.append('g');
let pointGroup = svg.append('g');

const zoom = d3.zoom().on('zoom', (e) => {
	lineGroup.attr('transform', e.transform);
	pointGroup.attr('transform', e.transform);
}) as any;

svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

function draw() {
	const delaunay = Delaunay.from(
		data.voronoiPoints,
		(d) => scalePointToScreen(d.center, screenSize, data.boundingBox).x,
		(d) => scalePointToScreen(d.center, screenSize, data.boundingBox).y
	);

	const voronoi = delaunay.voronoi([0, 0, screenSize.width, screenSize.height]);

	// draw the voronoi diagram
	let lines = lineGroup
		.selectAll('path')
		.data(voronoi.cellPolygons())
		.enter()
		.append('path')
		.attr('d', (d) => `M${d.join('L')}Z`)
		.attr('fill', 'none')
		.attr('stroke', 'black');

	lines.exit().remove();

	// draw the voronoi points
	let points = pointGroup
		.selectAll('circle')
		.data(data.voronoiPoints)
		.enter()
		.append('circle')
		.attr('cx', (d) => scalePointToScreen(d.center, screenSize, data.boundingBox).x)
		.attr('cy', (d) => scalePointToScreen(d.center, screenSize, data.boundingBox).y)
		.attr('r', 2)
		.attr('fill', 'black');

	points.exit().remove();
}

draw();

// draw on resize
window.addEventListener('resize', () => {
	screenSize.width = document.getElementById('voronoi')!.clientWidth;
	screenSize.height = document.getElementById('voronoi')!.clientHeight;

	svg.attr('width', screenSize.width).attr('height', screenSize.height);

	draw();
});
