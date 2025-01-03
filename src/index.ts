import * as d3 from 'd3';
import { loadAndComputeCSV } from './space_tesselation/spaceIndex';

// Load the CSV file and compute the data.
//Return type is a SpaceTesselation object. Look in interfaces
let res = loadAndComputeCSV('./data/MilanoData.csv');
