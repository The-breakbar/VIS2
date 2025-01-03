import { Trajectory, VoronoiCell, Visit, Move, TrajectoryAdvanced, Point } from '../interfaces';
import { spatialDistance } from './groupCharacteristicPoints';
import { movementToPoint } from '../tools';

import SegmentWorker from 'worker-loader!./dividTrajIntoSeg.worker.ts';

export async function segmentTrajectoriesParallel(trajectories: Trajectory[], voronoiCells: VoronoiCell[]): Promise<TrajectoryAdvanced[]> {
	let segmentTrajectories: TrajectoryAdvanced[] = [];
	var promises = [];

	for (let i = 0; i < trajectories.length; i += 2000) {
		const max = Math.min(i + 2000, trajectories.length);
		const subTrajectories = trajectories.slice(i, max);
		promises.push(createWorker(subTrajectories, voronoiCells));
	}

	let tmp = await Promise.all(promises);

	for (const trajectory of tmp) {
		segmentTrajectories = segmentTrajectories.concat(trajectory);
	}

	return segmentTrajectories;
}

export function segmentTrajectories(trajectories: Trajectory[], voronoiCells: VoronoiCell[]): TrajectoryAdvanced[] {
	const segmentedTrajectories: TrajectoryAdvanced[] = [];

	for (const trajectory of trajectories) {
		segmentedTrajectories.push(segmentTrajectory(trajectory, voronoiCells));
	}

	for (const trajectory of segmentedTrajectories) {
		computeStatistics(trajectory);
	}
	return segmentedTrajectories;
}

function createWorker(trajectory: Trajectory[], voronoiCells: VoronoiCell[]): Promise<TrajectoryAdvanced> {
	return new Promise((resolve, reject) => {
		const worker = new SegmentWorker();
		worker.postMessage({ trajectory: trajectory, voronoiCells: voronoiCells });
		worker.onmessage = (e: MessageEvent) => {
			resolve(e.data.segTraj);
		};
	});
}

//TODO: Optimize closestCell Finding
export function segmentTrajectory(trajectory: Trajectory, voronoiCells: VoronoiCell[]): TrajectoryAdvanced {
	const visits: Visit[] = [];
	const moves: Move[] = [];
	const seqOfCell: VoronoiCell[] = [];

	let distanceInsideCell = 0;

	for (let i = 0; i < trajectory.movements.length; i++) {
		const currMov = trajectory.movements[i];
		const movAsPoint = movementToPoint(currMov);
		const closestCell = voronoiCells.reduce(
			(acc, cell) => {
				const d = spatialDistance(movAsPoint, cell.center);
				if (d < acc.distance) {
					acc.distance = d;
					acc.cell = cell;
				}
				return acc;
			},
			{ cell: { id: -1, center: { x: -1, y: -1 }, exitPoint: { x: -1, y: -1 }, entryPoint: { x: -1, y: -1 }, points: [] as Point[] }, distance: Infinity }
		);

		closestCell.cell.points.push(movAsPoint);
		if (i == 0) {
			seqOfCell.push(closestCell.cell);
			seqOfCell[seqOfCell.length - 1].entryPoint = movAsPoint;
			continue;
		}

		distanceInsideCell += spatialDistance(movementToPoint(trajectory.movements[i - 1]), movAsPoint);
		//If the movement is inside the same cell, we continue
		if (closestCell.cell == seqOfCell[seqOfCell.length - 1]) {
			if (i == trajectory.movements.length - 1) {
				seqOfCell[seqOfCell.length - 1].exitPoint = movAsPoint;
				visits.push({
					cell: seqOfCell[seqOfCell.length - 1],
					tStart: trajectory.movements[i - 1].datetime,
					tEnd: currMov.datetime,
					distance: distanceInsideCell
				});
			}
			continue;
		}

		//Entering new cell
		seqOfCell[seqOfCell.length - 1].exitPoint = movementToPoint(trajectory.movements[i - 1]);

		seqOfCell.push(closestCell.cell);
		seqOfCell[seqOfCell.length - 1].entryPoint = movAsPoint;

		visits.push({
			cell: seqOfCell[seqOfCell.length - 1],
			tStart: trajectory.movements[i - 1].datetime,
			tEnd: currMov.datetime,
			distance: distanceInsideCell
		});

		distanceInsideCell = 0;

		if (visits.length >= 2) {
			const lastVisit = visits[visits.length - 2];
			moves.push({
				from: lastVisit.cell,
				to: visits[visits.length - 1].cell,
				tZero: lastVisit.tEnd,
				tFin: visits[visits.length - 1].tStart
			});
		}
	}

	return { original: trajectory, seqOfCell: seqOfCell, visits: visits, moves: moves };
}

function computeStatistics(trajectory: TrajectoryAdvanced): void {
	for (let visit of trajectory.visits) {
		visit.duration = visit.tEnd.getTime() - visit.tStart.getTime();
		visit.avgSpeed = (!!visit.distance ? visit.distance : -1) / (visit.duration / 1000); //If distance is not defined, avgSpeed is negative
	}

	for (let move of trajectory.moves) {
		move.duration = move.tFin.getTime() - move.tZero.getTime();
		move.distance = spatialDistance(move.from.exitPoint, move.to.entryPoint);
		move.avgSpeed = move.distance / (move.duration / 1000);
	}
}
