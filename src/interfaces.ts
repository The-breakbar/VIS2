export interface LooseObject {
	[key: string]: any;
}

export interface Movement {
	lat: number;
	lon: number;
	datetime: Date;
	pointCreatedFromMovement?: Point;
}
export interface Trajectory {
	id: string;
	movements: Movement[];
}

export interface CharacteristicPointParams {
	minAngle: number; //the minimum angle between the directions of consecutive trajectory segments to be considered as a significant turn;
	minStopDuration: number; // the minimum time spent in approximately the same position to be treated as a significant stop;
	minDistance: number; // when the distance between two consecutive points is below this value, the points are treated as approximately the same position;
	maxDistance: number; // the maximum allowed distance between consecutive characteristic points extracted from the trajectory (i.e., if the trajectory has a straight segment with the length more than this value, representative points must be taken such that the distances between them do not exceed this value).}
}

export interface Point {
	x: number;
	y: number;
	groupId?: number;
}

export interface BoundingBox {
	min: Point;
	max: Point;
}

export interface Group {
	id: number;
	members: Point[];
	center: Point;
	meanDist: number;
	density: number;
	medianPoint: Point;
}

export interface GridCell {
	value: Point | undefined;
}

export interface NoPoint {
	noPoint: true;
}

export interface Grid {
	boundingBox: BoundingBox;
	cellSize: number;
	grid: GridCell[][];
	gridSizeX: number;
	gridSizeY: number;
}

export interface VoronoiCell {
	id: number;
	center: Point;
	points: Point[];
	entryPoint: Point;
	exitPoint: Point;
}

export interface Visit {
	cell: VoronoiCell;
	tStart: Date;
	tEnd: Date;
	duration?: number;
	distance?: number;
	avgSpeed?: number;
}

export interface Move {
	from: VoronoiCell;
	to: VoronoiCell;
	tZero: Date;
	tFin: Date;
	duration?: number;
	distance?: number;
	avgSpeed?: number;
}

export interface TrajectoryAdvanced {
	original: Trajectory;
	seqOfCell: VoronoiCell[];
	visits: Visit[];
	moves: Move[];
}

export interface VoronoiCellStatistics {
	cell: VoronoiCell;
	visits: Visit[];
	durationStats?: StatisticInterface;
	distanceStats?: StatisticInterface;
	avgSpeedStats?: StatisticInterface;
}

export interface VoronoiCellPairStatistics {
	from: VoronoiCellStatistics;
	to: VoronoiCellStatistics;
	moves: Move[];
	durationStats?: StatisticInterface;
	distanceStats?: StatisticInterface;
	avgSpeedStats?: StatisticInterface;
}

export interface StatisticInterface {
	mean: number;
	median: number;
	variance: number;
	stdDev: number;
	min: number;
	max: number;
}

export interface SpaceTesselation {
	voronoiPoints: VoronoiCell[];
	realVornonoiPoints: number;
	aggregatedVisits: VoronoiCellStatistics[];
	aggregatedMoves: VoronoiCellPairStatistics[];
	segementedTrajectories: TrajectoryAdvanced[];
	boundingBox: BoundingBox;
}

export interface TesselationConfig {
	filePath: string;
	maxRadius: number;
	characteristicPointParams: CharacteristicPointParams;
}

export interface ScreenSize {
	width: number;
	height: number;
}

export interface TSNEConfig {
	dim: number;
	perplexity: number;
	earlyExaggeration: number;
	learningRate: number;
	nIter: number;
	metric: string;
}

export interface DimensionConfig {
	numTopics: number;
	numIterations: number;
	tsneConfig: TSNEConfig;
}

export interface DiagramElement {
	svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
	lineGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	pointGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	size: ScreenSize;
}

export interface TopicData {
	topics: number[][];
	topicColors: d3.Color[];
}
