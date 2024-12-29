export interface LooseObject {
    [key: string]: any;
}

export interface Movement {
    lat: number;
    lon: number;
    datetime: Date;
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
}

export interface BoundingBox {
    min: Point;
    max: Point;
}

export interface Group {
    members: Point[];
    center: Point;
    meanDist: number;
    density: number;
    medianPoint: Point;
}

export interface GridCell {
    value: Point | undefined;
}

export interface Grid {
    boundingBox: BoundingBox;
    cellSize: number;
    grid: GridCell[][];
    gridSizeX: number;
    gridSizeY: number;
}