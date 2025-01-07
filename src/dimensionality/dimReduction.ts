import { DimensionConfig, TopicData, TrajectoryAdvanced, TSNEConfig } from '../interfaces';
import { convertTopicColors } from './topicColors';
import { nmf } from './nmf';
import { tsne } from './tsne';
import * as nj from 'numjs';

export function reduceDimensions(trajectories: TrajectoryAdvanced[], noOfVocabs: number, config: DimensionConfig): TopicData {
	let data: nj.NdArray = nj.ones([trajectories.length, noOfVocabs]);

	for (let i = 0; i < trajectories.length; i++) {
		const currTraj = trajectories[i];
		for (let j = 0; j < currTraj.visits.length; j++) {
			const v = currTraj.visits[j].cell.id;
			data.set(i, v, data.get(i, v) + 1);
		}
	}

	let [W, H] = applyNMF(data, config.nmfTopics, config.nmfIterations);

	// let TSNE_from_W = applyTSNE(W.tolist(), tsneConfig);
	let TSNE_FROM_H = applyTSNE(H.tolist(), config.tsneConfig);

	return { topics: H.tolist(), topicColors: convertTopicColors(TSNE_FROM_H[1]) };
}

export function applyNMF(data: nj.NdArray, noOfTopics: number, maxNMFIter: number) {
	let [W, H] = nmf(data, noOfTopics, maxNMFIter);

	return [W, H];
}

export function applyTSNE(data: number[][], tsneConfig: TSNEConfig): any {
	let [output, outputScaled] = tsne(data, tsneConfig);

	return [output, outputScaled];
}
