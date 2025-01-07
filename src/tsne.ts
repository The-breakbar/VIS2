import TSNE from 'tsne-js';
import { TSNEConfig } from './interfaces';

export function tsne(data: number[][], config: TSNEConfig): any {
	let model = new TSNE(config);

	model.init({
		data: data,
		type: 'dense'
	});

	let [, ,] = model.run();

	let [, ,] = model.rerun();

	let output = model.getOutput();
	let outputScaled = model.getOutputScaled();

	return [output, outputScaled];
}
