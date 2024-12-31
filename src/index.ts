import * as d3 from 'd3';
import { readCSVasJSON } from './space_tesselation/readCSV';
import { createTrajectoriesFromCSV } from './space_tesselation/trajectories';
import { extractCharisticPointsFromAllTrajectories } from './space_tesselation/characteristicPoints';
import {
	groupingCharacteristicPointsInSpace,
	optimizeGroupsInRespectToPointDensity,
} from './space_tesselation/groupCharacteristicPoints';
import { getVoronoiPoints } from './space_tesselation/voronoiPointsCreation';
import { segmentTrajectories } from './space_tesselation/dividingTrajectoriesIntoSegments';
import { aggregateMoves, aggregateVisits } from './space_tesselation/aggregationOfData';
import { extractMovementIntoOneArray, movementToPoints } from './tools';

// Load the CSV file and compute the data.
async function loadAndComputeCSV(filePath: string) {
	const csv = await readCSVasJSON(filePath);
    // -----

	const trajectories = createTrajectoriesFromCSV(csv);
    // -----

	const characteristicPoints =
		extractCharisticPointsFromAllTrajectories(trajectories);

    // -----

	const movements = extractMovementIntoOneArray(characteristicPoints);
	const points = movementToPoints(movements);

    // ----- Grouping Characteristic Points in Space

	const groupedOutput = groupingCharacteristicPointsInSpace(points, 0.0001);
	const Groups = groupedOutput[0];
	const Grid = groupedOutput[1];

    // ----- Grouping Characteristic Points in Space - Optimization

	const optimizedGroups = optimizeGroupsInRespectToPointDensity(
		points,
		Groups,
		Grid
	);

    
    // ----- Partitioning the Territory
    
    const voronoiPoints = getVoronoiPoints(optimizedGroups, Grid);
    
    // ----- Dividing Trajectories into Segments
    
    const segmentedTrajectories = segmentTrajectories(Object.values(trajectories), voronoiPoints);
	

    // ----- Aggregation of data

    const aggregatedVisits = aggregateVisits(segmentedTrajectories, voronoiPoints);
    const aggregatedMoves = aggregateMoves(segmentedTrajectories, voronoiPoints, aggregatedVisits);

    // -----

    console.log(`CSV file loaded and computed: ${filePath}`);
	console.log(`Trajectories: ${trajectories.length}`);
	console.log(`Characteristic points: ${characteristicPoints.length}`);
	console.log(`Movements: ${movements.length}`);
	console.log(`Points: ${points.length}`);
	console.log(`Groups: ${Groups.length}`);
	console.log(`Grid: ${Grid.length}`);
	console.log(`Optimized groups: ${optimizedGroups.length}`);
}

loadAndComputeCSV('./data/MilanoData.csv');
