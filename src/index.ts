import * as d3 from 'd3';

import { loadAndComputeCSV } from './space_tesselation/spaceIndex';
import { BoundingBox, Point, ScreenSize } from './interfaces';
import { Delaunay } from 'd3';

const screenSize: ScreenSize = {
	width: window.innerWidth,
	height: window.innerHeight
};

const data = await loadAndComputeCSV({
	filePath: './data/SmallMilanoData.csv',
	maxRadius: 2500
});

// define a function that scales the data the screen size with the bounding box
function scalePointToScreen(point: Point, screenSize: ScreenSize, boundingBox: BoundingBox): Point {
	return {
		x: ((point.x - boundingBox.min.x) / (boundingBox.max.x - boundingBox.min.x)) * screenSize.width,
		y: ((point.y - boundingBox.min.y) / (boundingBox.max.y - boundingBox.min.y)) * screenSize.height
	};
}

let svg = d3.select('body').append('svg').attr('width', screenSize.width).attr('height', screenSize.height);

function draw() {
	const delaunay = Delaunay.from(
		data.voronoiPoints,
		(d) => scalePointToScreen(d.center, screenSize, data.boundingBox).x,
		(d) => scalePointToScreen(d.center, screenSize, data.boundingBox).y
	);

	const voronoi = delaunay.voronoi([0, 0, screenSize.width, screenSize.height]);

	// draw the voronoi diagram
	svg.append('g')
		.selectAll('path')
		.data(voronoi.cellPolygons())
		.enter()
		.append('path')
		.attr('d', (d) => `M${d.join('L')}Z`)
		.attr('fill', 'none')
		.attr('stroke', 'black');

	// draw the voronoi points
	svg.append('g')
		.selectAll('circle')
		.data(data.voronoiPoints)
		.enter()
		.append('circle')
		.attr('cx', (d) => scalePointToScreen(d.center, screenSize, data.boundingBox).x)
		.attr('cy', (d) => scalePointToScreen(d.center, screenSize, data.boundingBox).y)
		.attr('r', 2)
		.attr('fill', 'black');
}

draw();

// draw on resize
window.addEventListener('resize', () => {
	screenSize.width = window.innerWidth;
	screenSize.height = window.innerHeight;

	// create new svg
	svg.remove();
	svg = d3.select('body').append('svg').attr('width', screenSize.width).attr('height', screenSize.height);

	draw();
});
