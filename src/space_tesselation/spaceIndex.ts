import { readCSVasJSON } from './readCSV';
import { createTrajectoriesFromCSV } from './trajectories';
import { extractCharisticPointsFromAllTrajectories } from './characteristicPoints';
import { groupingCharacteristicPointsInSpace, optimizeGroupsInRespectToPointDensity } from './groupCharacteristicPoints';
import { getVoronoiPoints } from './voronoiPointsCreation';
import { segmentTrajectories } from './dividingTrajectoriesIntoSegments';
import { aggregateMoves, aggregateVisits } from './aggregationOfData';
import { extractMovementIntoOneArray, movementToPoints } from './../tools';

import { SpaceTesselation } from '../interfaces';

export async function loadAndComputeCSV(filePath: string): Promise<SpaceTesselation> {
	let startTime = new Date();
	let lastTime = new Date();
	console.log('Loading CSV data...');
	const csv = await readCSVasJSON(filePath);
	console.log(`CSV file loaded and computed: ${filePath}`);
	console.log(csv.length);
	console.log('CSV data loaded');
	let newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// -----

	const trajectories = createTrajectoriesFromCSV(csv);
	console.log(`Trajectories: ${trajectories.size}`);
	console.log('Trajectories created');

	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// -----

	const characteristicPoints = extractCharisticPointsFromAllTrajectories(trajectories);
	console.log(`Characteristic points: ${characteristicPoints.size}`);

	console.log('Characteristic points extracted');
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// -----

	const movements = extractMovementIntoOneArray(characteristicPoints);
	const points = movementToPoints(movements);
	console.log(`Movements: ${movements.length}`);
	console.log(`Points: ${points.length}`);
	console.log('Movements and points extracted');
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// ----- Grouping Characteristic Points in Space

	const groupedOutput = groupingCharacteristicPointsInSpace(points, 300);
	const Groups = groupedOutput[0];
	const Grid = groupedOutput[1];
	console.log(`Groups: ${Groups.length}`);
	console.log(`Grid: ${Grid.length}`);
	console.log('Characteristic points grouped');
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// ----- Grouping Characteristic Points in Space - Optimization

	const optimizedGroups = optimizeGroupsInRespectToPointDensity(points, Groups, Grid);
	console.log(`Optimized groups: ${optimizedGroups.length}`);
	console.log('Characteristic points optimized');
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;

	// ----- Partitioning the Territory

	const voronoiPoints = getVoronoiPoints(optimizedGroups, Grid);
	console.log(`Voronoi points: ${voronoiPoints.length}`);
	console.log('Voronoi points created');
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// ----- Dividing Trajectories into Segments

	const segmentedTrajectories = segmentTrajectories([...trajectories.values()], voronoiPoints);
	console.log(`Segmented trajectories: ${segmentedTrajectories.length}`);
	console.log('Trajectories segmented');
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	// ----- Aggregation of data

	const aggregatedVisits = aggregateVisits(segmentedTrajectories, voronoiPoints);
	console.log(`Aggregated visits: ${aggregatedVisits.length}`);
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	const aggregatedMoves = aggregateMoves(segmentedTrajectories, voronoiPoints, aggregatedVisits);
	console.log(`Aggregated moves: ${aggregatedMoves.length}`);
	newTime = new Date();
	console.log(`Time taken: ${(newTime.getTime() - lastTime.getTime()) / 1000} sek`);
	lastTime = newTime;
	console.log('Data aggregated');
	// -----
	let endTime = new Date();
	console.log(`Total time taken: ${(endTime.getTime() - startTime.getTime()) / 1000} sek`);

	return {
		segementedTrajectories: segmentedTrajectories,
		voronoiPoints: voronoiPoints,
		aggregatedVisits: aggregatedVisits,
		aggregatedMoves: aggregatedMoves
	};
}
