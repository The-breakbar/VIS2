import { segmentTrajectories, segmentTrajectory } from './dividingTrajectoriesIntoSegments';
import { Trajectory, VoronoiCell } from '../interfaces';

const ctx: Worker = self as any;

ctx.addEventListener('message', (e: MessageEvent) => {
	const trajectory: Trajectory[] = e.data.trajectory;
	const voronoiCells: VoronoiCell[] = e.data.voronoiCells;

	const segmentedTrajectories = segmentTrajectories(trajectory, voronoiCells);

	ctx.postMessage({ segTraj: segmentedTrajectories });
});
