import { DimensionConfig, TopicData, TrajectoryAdvanced, TSNEConfig } from '../interfaces';
import { convertTopicColors } from './topicColors';
import { nmf } from './nmf';
import { tsne } from './tsne';
import * as nj from 'numjs';
import { mds } from './mds';

export function reduceDimensions(trajectories: TrajectoryAdvanced[], noOfVocabs: number, config: DimensionConfig): TopicData {
	let startTime = new Date();
	let data: nj.NdArray = nj.ones([trajectories.length, noOfVocabs]);

	for (let i = 0; i < trajectories.length; i++) {
		const currTraj = trajectories[i];
		for (let j = 0; j < currTraj.visits.length; j++) {
			const v = currTraj.visits[j].cell.id;
			data.set(i, v, data.get(i, v) + 1);
		}
	}

	// H has the shape [noOfTopics, noOfVocabs]
	let [W, H] = applyNMF(data, config.numTopics, config.nmfIterations);

	// let TSNE_from_W = applyTSNE(W.tolist(), tsneConfig);
	// let TSNE_FROM_H = applyTSNE(H.tolist(), config.tsneConfig);

	// calculate a distance matrix for mds
	let distMatrix = nj.zeros([config.numTopics, config.numTopics]);
	for (let i = 0; i < config.numTopics; i++) {
		for (let j = 0; j < config.numTopics; j++) {
			let dist = 0;
			for (let k = 0; k < noOfVocabs; k++) {
				dist += Math.pow(H.get(i, k) - H.get(j, k), 2);
			}
			distMatrix.set(i, j, Math.sqrt(dist));
		}
	}
	let MDS_FROM_H = mds(distMatrix.tolist(), 2);

	console.log('Time taken for NMF and dimension reduction: ' + (new Date().getTime() - startTime.getTime()) / 1000 + ' sek');

	return { topics: H.tolist(), topicColors: convertTopicColors(MDS_FROM_H) };
}

export function applyNMF(data: nj.NdArray, noOfTopics: number, maxNMFIter: number) {
	let [W, H] = nmf(data, noOfTopics, maxNMFIter);

	return [W, H];
}

export function applyTSNE(data: number[][], tsneConfig: TSNEConfig): any {
	let [output, outputScaled] = tsne(data, tsneConfig);

	return [output, outputScaled];
}
