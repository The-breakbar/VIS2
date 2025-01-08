import * as d3 from 'd3';
import { Delaunay } from 'd3';
import { BoundingBox, DiagramElement, Point, ScreenSize, SpaceTesselation, TopicData } from '../interfaces';
import { scalePointToScreen } from './coordsProjection';

export function initializeDiagram(screenSize: ScreenSize): DiagramElement {
	const svg = d3.select('#voronoi').append('svg').attr('width', screenSize.width).attr('height', screenSize.height);
	const lineGroup = svg.append('g');
	const pointGroup = svg.append('g');

	const zoom = d3
		.zoom()
		.scaleExtent([0.8, 12])
		.translateExtent([
			[0, 0],
			[1.5 * screenSize.width, 1.5 * screenSize.height]
		])
		.on('zoom', (e) => {
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
		.data(Array.from(voronoi.cellPolygons()).filter((d, i) => i < data.realVornonoiPoints))
		.enter()
		.append('path')
		.attr('d', (d) => `M${d.join('L')}Z`)
		.attr('fill', (d, i) => {
			if (i >= data.realVornonoiPoints) return 'none';

			let topicValues = topicData.topics.map((t) => t[i]);
			let maxTopicValue = Math.max(...topicValues);
			let topicIndex = topicValues.indexOf(maxTopicValue);

			let color = topicData.topicColors[topicIndex];
			color = d3.rgb(color.r, color.g, color.b, 0.6);

			return color.toString();
		})
		.attr('stroke', 'rgb(100, 100, 100)');

	lines.exit().remove();

	// draw the pie charts
	let pieCharts = diagram.pointGroup
		.selectAll('g')
		.data(data.voronoiPoints.filter((d, i) => i < data.realVornonoiPoints))
		.enter()
		.append((d, i) => {
			const group = document.createElementNS(d3.namespaces.svg, 'g');

			let topicValues = topicData.topics.map((t, topicIndex) => {
				return { val: t[i], index: topicIndex };
			});
			topicValues.sort((a, b) => b.val - a.val);
			let topicValueSum = topicValues.reduce((a, b) => a + b.val, 0);

			const cx = scalePointToScreen(d.center, diagram.size, data.boundingBox).x;
			const cy = scalePointToScreen(d.center, diagram.size, data.boundingBox).y;
			const radius = Math.max(10 + (70 - data.realVornonoiPoints) * 0.12, 5);

			const coverageTarget = 0.9;
			let coverage = 0;
			// add topics until they cover 90% of the pie chart
			topicValues = topicValues.filter((topic) => {
				coverage += topic.val / topicValueSum;
				return coverage < coverageTarget;
			});
			topicValueSum = topicValues.reduce((a, b) => a + b.val, 0);

			// add a slightly larger circle as a border
			const borderCircle = document.createElementNS(d3.namespaces.svg, 'circle');
			borderCircle.setAttribute('cx', cx.toString());
			borderCircle.setAttribute('cy', cy.toString());
			borderCircle.setAttribute('r', (2 * radius).toString());
			borderCircle.setAttribute('fill', 'none');
			borderCircle.setAttribute('stroke', 'rgb(100, 100, 100)');
			borderCircle.setAttribute('stroke-width', (radius * 0.1).toString());
			group.appendChild(borderCircle);

			let currentOffset = 0;
			topicValues.forEach((topic) => {
				const circle = document.createElementNS(d3.namespaces.svg, 'circle');
				const percentage = topic.val / topicValueSum;

				// calculate circumference of the pie chart slice
				const circumference = 2 * Math.PI * radius * percentage;

				// set the circle attributes using stroke-dasharray to create the pie chart
				circle.setAttribute('cx', cx.toString());
				circle.setAttribute('cy', cy.toString());
				circle.setAttribute('r', radius.toString());
				circle.setAttribute('fill', 'none');
				circle.setAttribute('stroke', topicData.topicColors[topic.index].toString());
				circle.setAttribute('stroke-width', `${radius * 2}`);
				circle.setAttribute('stroke-dasharray', `${circumference} ${2 * Math.PI * radius}`);
				circle.setAttribute('stroke-dashoffset', currentOffset.toString());
				currentOffset -= circumference;

				// transform the circle to start at the top of the pie chart
				circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);

				group.appendChild(circle);
			});

			return group;
		});

	pieCharts.exit().remove();
}
