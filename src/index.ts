import * as d3 from 'd3';
import { readCSVasJSON } from './space_tesselation/readCSV';
import { createTrajectoriesFromCSV } from './space_tesselation/trajectories';
import { extractCharisticPointsFromAllTrajectories } from './space_tesselation/characteristicPoints';
import { groupingCharacteristicPointsInSpace, optimizeGroupsInRespectToPointDensity } from './space_tesselation/groupCharacteristicPoints';
import { getVoronoiPoints } from './space_tesselation/voronoiPointsCreation';
import { segmentTrajectories } from './space_tesselation/dividingTrajectoriesIntoSegments';
import { aggregateMoves, aggregateVisits } from './space_tesselation/aggregationOfData';
import { extractMovementIntoOneArray, movementToPoints } from './tools';

// Load the CSV file and compute the data.
async function loadAndComputeCSV(filePath: string) {
	console.log('Loading CSV data...');
	const csv = await readCSVasJSON(filePath);
	console.log(`CSV file loaded and computed: ${filePath}`);
	console.log(csv.length);
	console.log('CSV data loaded');

	// -----

	const trajectories = createTrajectoriesFromCSV(csv);
	console.log(`Trajectories: ${trajectories.size}`);
	console.log('Trajectories created');
	// -----

	const characteristicPoints = extractCharisticPointsFromAllTrajectories(trajectories);
	console.log(`Characteristic points: ${characteristicPoints.size}`);

	console.log('Characteristic points extracted');
	// -----

	const movements = extractMovementIntoOneArray(characteristicPoints);
	const points = movementToPoints(movements);
	console.log(`Movements: ${movements.length}`);
	console.log(`Points: ${points.length}`);
	console.log('Movements and points extracted');
	// ----- Grouping Characteristic Points in Space

	const groupedOutput = groupingCharacteristicPointsInSpace(points, 0.0001);
	const Groups = groupedOutput[0];
	const Grid = groupedOutput[1];
	console.log(`Groups: ${Groups.length}`);
	console.log(`Grid: ${Grid.length}`);
	console.log('Characteristic points grouped');
	// ----- Grouping Characteristic Points in Space - Optimization

	const optimizedGroups = optimizeGroupsInRespectToPointDensity(points, Groups, Grid);
	console.log(`Optimized groups: ${optimizedGroups.length}`);
	console.log('Characteristic points optimized');
	// ----- Partitioning the Territory

	const voronoiPoints = getVoronoiPoints(optimizedGroups, Grid);
	console.log(`Voronoi points: ${voronoiPoints.length}`);
	console.log('Voronoi points created');
	// ----- Dividing Trajectories into Segments

	const segmentedTrajectories = segmentTrajectories(Object.values(trajectories), voronoiPoints);
	console.log(`Segmented trajectories: ${segmentedTrajectories.length}`);
	console.log('Trajectories segmented');
	// ----- Aggregation of data

	const aggregatedVisits = aggregateVisits(segmentedTrajectories, voronoiPoints);
	const aggregatedMoves = aggregateMoves(segmentedTrajectories, voronoiPoints, aggregatedVisits);
	console.log(`Aggregated visits: ${aggregatedVisits.length}`);
	console.log(`Aggregated moves: ${aggregatedMoves.length}`);
	console.log('Data aggregated');
	// -----
}

loadAndComputeCSV('./data/SmallMilanoData.csv');
