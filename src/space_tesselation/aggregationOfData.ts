import {
    TrajectoryAdvanced,
    VoronoiCell,
    VoronoiCellStatistics,
    VoronoiCellPairStatistics,
    StatisticInterface,
} from '../interfaces';

//TODO: insert time filtering so stats are calculated only for visits/moves in the given time range

export function aggregateVisits(trajectories: TrajectoryAdvanced[], voronoiCells: VoronoiCell[]): VoronoiCellStatistics[] {
    const cellStatistics: VoronoiCellStatistics[] = [];

    for (const vc of voronoiCells) {
        const cellStat: VoronoiCellStatistics = { cell: vc, visits: [] };
        cellStatistics.push(cellStat);
        for (const trajectory of trajectories) {
            for (const visit of trajectory.visits) {
                if (visit.cell === vc) {
                    cellStat.visits.push(visit);
                }
            }
        }

        for (const cellStat of cellStatistics) {
            cellStat.durationStats = getStats(cellStat.visits.map(v => (v.duration ? v.duration : 0)));
            cellStat.distanceStats = getStats(cellStat.visits.map(v => (v.distance ? v.distance : 0)));
            cellStat.avgSpeedStats = getStats(cellStat.visits.map(v => (v.avgSpeed ? v.avgSpeed : 0)));
        }
    }
    return cellStatistics;
}

export function aggregateMoves(
    trajectories: TrajectoryAdvanced[],
    voronoiCells: VoronoiCell[],
    voronoiCellsStats: VoronoiCellStatistics[],
): VoronoiCellPairStatistics[] {
    const cellPairStatistics: VoronoiCellPairStatistics[] = [];

    for (const vc of voronoiCells) {
        for (const vc2 of voronoiCells) {
            if (vc === vc2) {
                continue;
            }

            const cellPairStat: VoronoiCellPairStatistics = {
                from:
                    voronoiCellsStats.find(vcs => vcs.cell === vc) ??
                    (() => {
                        throw new Error('VoronoiCellStatistics not found for from cell');
                    })(),
                to:
                    voronoiCellsStats.find(vcs => vcs.cell === vc2) ??
                    (() => {
                        throw new Error('VoronoiCellStatistics not found for to cell');
                    })(),
                moves: [],
            };

            for (const trajectory of trajectories) {
                for (const move of trajectory.moves) {
                    if (move.from === vc && move.to === vc2) {
                        cellPairStat.moves.push(move);
                    }
                }
            }

            cellPairStatistics.push(cellPairStat);
        }
    }

    for (const cellPairStat of cellPairStatistics) {
        cellPairStat.durationStats = getStats(cellPairStat.moves.map(m => (m.duration ? m.duration : 0)));
        cellPairStat.distanceStats = getStats(cellPairStat.moves.map(m => (m.distance ? m.distance : 0)));
        cellPairStat.avgSpeedStats = getStats(cellPairStat.moves.map(m => (m.avgSpeed ? m.avgSpeed : 0)));
    }

    return cellPairStatistics;
}

function getStats(arr?: number[]): StatisticInterface {
    if (!arr || arr.length === 0) {
        throw new Error('Empty array');
    }

    const avg = arr.reduce((acc, curr) => acc + curr, 0) / arr.length;

    return {
        mean: avg,
        median: arr.sort((a, b) => a - b)[Math.floor(arr.length / 2)],
        variance: arr.reduce((acc, curr) => acc + (curr - avg) ** 2, 0) / arr.length,
        stdDev: Math.sqrt(arr.reduce((acc, curr) => acc + (curr - avg) ** 2, 0) / arr.length),
        min: Math.min(...arr),
        max: Math.max(...arr),
    };
}
