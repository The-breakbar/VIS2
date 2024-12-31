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

// Declare the chart dimensions and margins.
const width = 640;
const height = 400;
const marginTop = 20;
const marginRight = 20;
const marginBottom = 30;
const marginLeft = 40;

// Declare the x (horizontal position) scale.
const x = d3
    .scaleUtc()
    .domain([new Date('2023-01-01'), new Date('2024-01-01')])
    .range([marginLeft, width - marginRight]);

// Declare the y (vertical position) scale.
const y = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - marginBottom, marginTop]);

// Create the SVG container.
const svg = d3.create('svg').attr('width', width).attr('height', height);

// Add the x-axis.
svg.append('g')
    .attr('transform', `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));

// Add the y-axis.
svg.append('g').attr('transform', `translate(${marginLeft},0)`).call(d3.axisLeft(y));

// Append the SVG element.
document.body.appendChild(svg.node() as Node);

// Load the CSV file and compute the data.
function loadAndComputeCSV(filePath: string) {
    const csv = readCSVasJSON(filePath);
    // -----

    const trajectories = createTrajectoriesFromCSV(csv);
    // -----

    const characteristicPoints = extractCharisticPointsFromAllTrajectories(trajectories);

    // -----

    const movements = extractMovementIntoOneArray(characteristicPoints);
    const points = movementToPoints(movements);

    // ----- Grouping Characteristic Points in Space

    const groupedOutput = groupingCharacteristicPointsInSpace(points, 0.0001);
    const Groups = groupedOutput[0];
    const Grid = groupedOutput[1];

    // ----- Grouping Characteristic Points in Space - Optimization

    const optimizedGroups = optimizeGroupsInRespectToPointDensity(points, Groups, Grid);

    // ----- Partitioning the Territory

    const voronoiPoints = getVoronoiPoints(optimizedGroups, Grid);

    // ----- Dividing Trajectories into Segments

    const segmentedTrajectories = segmentTrajectories(Object.values(trajectories), voronoiPoints);

    // ----- Aggregation of data

    const aggregatedVisits = aggregateVisits(segmentedTrajectories, voronoiPoints);
    const aggregatedMoves = aggregateMoves(segmentedTrajectories, voronoiPoints, aggregatedVisits);

    // -----
}
