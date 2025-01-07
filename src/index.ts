import * as d3 from 'd3';

import './style.css';

import { loadAndComputeCSV } from './space_tesselation/spaceIndex';
import { reduceDimensions } from './dimensionality/dimReduction';
import { draw, initializeDiagram } from './visualization/draw';
import { getInputConfig, updateUIAfterComputation } from './visualization/ui';

const defaultTessConfig = {
	filePath: './data/MilanoData.csv',
	maxRadius: 2500,
	characteristicPointParams: {
		minAngle: 30, //Degrees
		minStopDuration: 300 * 1000, //Seconds times milliseconds
		minDistance: 250, //Meters
		maxDistance: 2500 //Meters
	}
};

const defaultDimConfig = {
	numTopics: 20,
	numIterations: 11,
	tsneConfig: {
		dim: 2,
		perplexity: 30.0,
		earlyExaggeration: 4.0,
		learningRate: 100.0,
		nIter: 500,
		metric: 'euclidean'
	}
};

document.getElementById('compute')!.addEventListener('click', async () => {
	const [tessConfig, dimConfig] = getInputConfig(defaultTessConfig, defaultDimConfig);

	const data = await loadAndComputeCSV(tessConfig);
	updateUIAfterComputation(data);

	const topicData = reduceDimensions(data.segementedTrajectories, data.realVornonoiPoints, dimConfig);

	const diagram = initializeDiagram({
		width: document.getElementById('voronoi')!.clientWidth,
		height: document.getElementById('voronoi')!.clientHeight
	});
	draw(diagram, data, topicData);

	// set drawback for draw on resize
	window.addEventListener('resize', () => {
		diagram.size.width = document.getElementById('voronoi')!.clientWidth;
		diagram.size.height = document.getElementById('voronoi')!.clientHeight;

		diagram.svg.attr('width', diagram.size.width).attr('height', diagram.size.height);

		draw(diagram, data, topicData);
	});
});
