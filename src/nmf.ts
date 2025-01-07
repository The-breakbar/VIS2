import * as nj from 'numjs';

export function nmf(V: nj.NdArray, rank: number, maxIter: number, tol: number): [nj.NdArray, nj.NdArray] {
	const [row, col] = V.shape;

	let W = nj.random([row, rank]);
	let H = nj.random([rank, col]);

	for (let i = 0; i < maxIter; i++) {
		//Update H
		const numeratorH = nj.dot(W.transpose(), V);
		const denominatorH = nj.dot(W.transpose(), nj.dot(W, H));
		H = H.multiply(numeratorH.divide(denominatorH));

		//Update W
		const numeratorW = nj.dot(V, H.transpose());
		const denominatorW = nj.dot(W, nj.dot(H, H.transpose()));
		W = W.multiply(numeratorW.divide(denominatorW));
	}

	return [W, H];
}
