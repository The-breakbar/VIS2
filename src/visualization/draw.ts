import * as d3 from 'd3';
import { Delaunay } from 'd3';
import { BoundingBox, DiagramElement, Point, ScreenSize, SpaceTesselation, TopicData } from '../interfaces';
import { scalePointToScreen } from './coordsProjection';

export function initializeDiagram(screenSize: ScreenSize): DiagramElement {
	const svg = d3.select('#voronoi').append('svg').attr('width', screenSize.width).attr('height', screenSize.height);
	const lineGroup = svg.append('g');
	const pointGroup = svg.append('g');

	const zoom = d3.zoom().on('zoom', (e) => {
		lineGroup.attr('transform', e.transform);
		pointGroup.attr('transform', e.transform);
	}) as any;

	svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

	return { svg, lineGroup, pointGroup, size: screenSize };
}

export function draw(diagram: DiagramElement, data: SpaceTesselation, topicData: TopicData) {
	const delaunay = Delaunay.from(
		data.voronoiPoints,
		(d) => scalePointToScreen(d.center, diagram.size, data.boundingBox).x,
		(d) => scalePointToScreen(d.center, diagram.size, data.boundingBox).y
	);

	const voronoi = delaunay.voronoi([0, 0, diagram.size.width, diagram.size.height]);

	// draw the voronoi diagram
	let lines = diagram.lineGroup
		.selectAll('path')
		.data(voronoi.cellPolygons())
		.enter()
		.append('path')
		.attr('d', (d) => `M${d.join('L')}Z`)
		// make the fill be more and more darker depending on the index
		.attr('fill', (d, i) => {
			if (i >= data.realVornonoiPoints) return 'none';

			let topicValues = topicData.topics.map((t) => t[i]);
			let maxTopicValue = Math.max(...topicValues);
			let topicIndex = topicValues.indexOf(maxTopicValue);

			return topicData.topicColors[topicIndex].toString();
		})
		.attr('stroke', 'rgb(200, 200, 200)');

	lines.exit().remove();

	// draw the voronoi points
	let points = diagram.pointGroup
		.selectAll('circle')
		.data(
			data.voronoiPoints.filter(
				(d) => d.center.x >= data.boundingBox.min.x && d.center.x <= data.boundingBox.max.x && d.center.y >= data.boundingBox.min.y && d.center.y <= data.boundingBox.max.y
			)
		)
		.enter()
		.append('circle')
		.attr('cx', (d) => scalePointToScreen(d.center, diagram.size, data.boundingBox).x)
		.attr('cy', (d) => scalePointToScreen(d.center, diagram.size, data.boundingBox).y)
		.attr('r', 2)
		.attr('fill', 'black');

	points.exit().remove();
}
