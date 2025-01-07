import { TrajectoryAdvanced, TSNEConfig } from './interfaces';
import { nmf } from './nmf';
import { tsne } from './tsne';
import * as nj from 'numjs';

export function reduceDimensions(trajectories: TrajectoryAdvanced[], noOfVocabs: number, noOfTopics: number, maxNMFIter: number, tsneConfig: TSNEConfig): any {
	let data: nj.NdArray = nj.ones([trajectories.length, noOfVocabs]);

	for (let i = 0; i < trajectories.length; i++) {
		const currTraj = trajectories[i];
		for (let j = 0; j < currTraj.visits.length; j++) {
			const v = currTraj.visits[j].cell.id;
			data.set(i, v, data.get(i, v) + 1);
		}
	}

	let [W, H] = applyNMF(data, noOfTopics, maxNMFIter);

	// let TSNE_from_W = applyTSNE(W.tolist(), tsneConfig);
	let TSNE_FROM_H = applyTSNE(H.tolist(), tsneConfig);

	return TSNE_FROM_H;
}

export function applyNMF(data: nj.NdArray, noOfTopics: number, maxNMFIter: number) {
	let [W, H] = nmf(data, noOfTopics, maxNMFIter);

	return [W, H];
}

export function applyTSNE(data: number[][], tsneConfig: TSNEConfig): any {
	let [output, outputScaled] = tsne(data, tsneConfig);

	return [output, outputScaled];
}
