import { Trajectory, VoronoiCell, Visit, Move, TrajectoryAdvanced } from '../interfaces';
import { spatialDistance } from './groupCharacteristicPoints';
import { movementToPoint } from '../tools';

export function segmentTrajectories(trajectories: Trajectory[], voronoiCells: VoronoiCell[]): TrajectoryAdvanced[] {
    const segmentedTrajectories: TrajectoryAdvanced[] = [];
    for (const trajectory of trajectories) {
        segmentedTrajectories.push(segmentTrajectory(trajectory, voronoiCells));
    }

    return segmentedTrajectories;
}

function segmentTrajectory(trajectory: Trajectory, voronoiCells: VoronoiCell[]): TrajectoryAdvanced {
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
            { cell: { center: { x: -1, y: -1 }, exitPoint: { x: -1, y: -1 }, entryPoint: { x: -1, y: -1 } }, distance: Infinity },
        );

        if (i == 0) {
            seqOfCell.push(closestCell.cell);
            seqOfCell[seqOfCell.length - 1].entryPoint = movAsPoint;
            continue;
        }

        distanceInsideCell += spatialDistance(movementToPoint(trajectory.movements[i - 1]), movAsPoint);
        if ((closestCell.cell = seqOfCell[seqOfCell.length - 1])) {
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
            distance: distanceInsideCell,
        });

        distanceInsideCell = 0;

        if (visits.length >= 2) {
            const lastVisit = visits[visits.length - 2];
            moves.push({
                from: lastVisit.cell,
                to: visits[visits.length - 1].cell,
                tZero: lastVisit.tEnd,
                tFin: visits[visits.length - 1].tStart,
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
