import { TrajectoryAdvanced, VoronoiCell, VoronoiCellStatistics, VoronoiCellPairStatistics, StatisticInterface, Move, Visit } from '../interfaces';

//TODO: insert time filtering so stats are calculated only for visits/moves in the given time range

export function aggregateVisits(trajectories: TrajectoryAdvanced[], voronoiCells: VoronoiCell[]): VoronoiCellStatistics[] {
	const cellStatistics: VoronoiCellStatistics[] = [];
	const map = new Map<number, Visit[]>();
	for (const t of trajectories) {
		for (const v of t.visits) {
			if (!map.has(v.cell.id)) {
				map.set(v.cell.id, []);
			}
			map.get(v.cell.id)?.push(v);
		}
	}

	for (const [key, value] of map) {
		const cellStat: VoronoiCellStatistics = { cell: voronoiCells[key], visits: value };
		cellStatistics.push(cellStat);
	}

	// for (const vc of voronoiCells) {
	// 	let accVisits = [] as Visit[];
	// 	for (const trajectory of trajectories) {
	// 		for (const visit of trajectory.visits) {
	// 			if (visit.cell === vc) {
	// 				accVisits.push(visit);
	// 			}
	// 		}
	// 	}
	// 	if (accVisits.length === 0) {
	// 		continue;
	// 	}

	// 	const cellStat: VoronoiCellStatistics = { cell: vc, visits: accVisits };
	// 	cellStatistics.push(cellStat);
	// }

	for (const cellStat of cellStatistics) {
		cellStat.durationStats = getStats(cellStat.visits.map((v) => (v.duration ? v.duration : 0)));
		cellStat.distanceStats = getStats(cellStat.visits.map((v) => (v.distance ? v.distance : 0)));
		cellStat.avgSpeedStats = getStats(cellStat.visits.map((v) => (v.avgSpeed ? v.avgSpeed : 0)));
	}
	return cellStatistics;
}

export function aggregateMoves(trajectories: TrajectoryAdvanced[], voronoiCells: VoronoiCell[], voronoiCellsStats: VoronoiCellStatistics[]): VoronoiCellPairStatistics[] {
	const cellPairStatistics: VoronoiCellPairStatistics[] = [];

	const map = new Map<number, Map<number, Move[]>>();
	for (const t of trajectories) {
		for (const m of t.moves) {
			if (!map.has(m.from.id)) {
				map.set(m.from.id, new Map<number, Move[]>());
			}
			if (!map.get(m.from.id)?.has(m.to.id)) {
				map.get(m.from.id)?.set(m.to.id, []);
			}
			map.get(m.from.id)?.get(m.to.id)?.push(m);
		}
	}

	for (const [fromKey, toMap] of map) {
		for (const [toKey, moves] of toMap) {
			const fromCell = voronoiCellsStats[fromKey];
			const toCell = voronoiCellsStats[toKey];

			const cellPairStat: VoronoiCellPairStatistics = {
				from: fromCell,
				to: toCell,
				moves: moves
			};

			cellPairStatistics.push(cellPairStat);
		}
	}

	// for (const vcs of voronoiCellsStats) {
	// 	for (const vcs2 of voronoiCellsStats) {
	// 		if (vcs === vcs2) {
	// 			continue;
	// 		}
	// 		let accMoves = [] as Move[];
	// 		for (const trajectory of trajectories) {
	// 			for (const move of trajectory.moves) {
	// 				if (move.from === vcs.cell && move.to === vcs2.cell) {
	// 					accMoves.push(move);
	// 				}
	// 			}
	// 		}
	// 		if (accMoves.length === 0) {
	// 			continue;
	// 		}

	// 		const cellPairStat: VoronoiCellPairStatistics = {
	// 			from: vcs,
	// 			to: vcs2,
	// 			moves: accMoves
	// 		};

	// 		cellPairStatistics.push(cellPairStat);
	// 	}
	// }

	// for (const vc of voronoiCells) {
	// 	for (const vc2 of voronoiCells) {
	// 		if (vc === vc2) {
	// 			continue;
	// 		}
	// 		let accMoves = [] as Move[];
	// 		for (const trajectory of trajectories) {
	// 			for (const move of trajectory.moves) {
	// 				if (move.from === vc && move.to === vc2) {
	// 					accMoves.push(move);
	// 				}
	// 			}
	// 		}

	// 		const cellPairStat: VoronoiCellPairStatistics = {
	// 			from:
	// 				voronoiCellsStats.find((vcs) => vcs.cell === vc) ??
	// 				(() => {
	// 					throw new Error('VoronoiCellStatistics not found for from cell');
	// 				})(),
	// 			to:
	// 				voronoiCellsStats.find((vcs) => vcs.cell === vc2) ??
	// 				(() => {
	// 					throw new Error('VoronoiCellStatistics not found for to cell');
	// 				})(),
	// 			moves: accMoves,
	// 		};

	// 		cellPairStatistics.push(cellPairStat);
	// 	}
	//  }

	for (const cellPairStat of cellPairStatistics) {
		cellPairStat.durationStats = getStats(cellPairStat.moves.map((m) => (m.duration ? m.duration : 0)));
		cellPairStat.distanceStats = getStats(cellPairStat.moves.map((m) => (m.distance ? m.distance : 0)));
		cellPairStat.avgSpeedStats = getStats(cellPairStat.moves.map((m) => (m.avgSpeed ? m.avgSpeed : 0)));
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
		max: Math.max(...arr)
	};
}
