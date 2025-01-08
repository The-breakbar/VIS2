import { SVD } from 'svd-js';

function meanArray(arr: number[]): number {
	return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function rowMeans(matrix: number[][]): number[] {
	return matrix.map((r) => meanArray(r));
}

function colMeans(matrix: number[][]): number[] {
	const cols = matrix[0].length;
	const means: number[] = Array(cols).fill(0);
	for (let j = 0; j < cols; j++) {
		let sum = 0;
		for (let i = 0; i < matrix.length; i++) {
			sum += matrix[i][j];
		}
		means[j] = sum / matrix.length;
	}
	return means;
}

export function mds(distances: number[][], dimensions: number = 2): number[][] {
	// given a matrix of distances between some points, returns the
	// point coordinates that best approximate the distances using
	// classic multidimensional scaling

	// square distances
	const M = distances.map((row) => row.map((d) => -0.5 * d ** 2));

	// double centre the rows/columns
	const rMeans = rowMeans(M);
	const cMeans = colMeans(M);
	const totalMean = meanArray(rMeans);
	for (let i = 0; i < M.length; i++) {
		for (let j = 0; j < M[i].length; j++) {
			M[i][j] += totalMean - rMeans[i] - cMeans[j];
		}
	}

	// take the SVD of the double centred matrix, and return the
	// points from it
	const { q, u, v } = SVD(M);
	const L = q.map((r) => Math.sqrt(r));
	const result = u.map((row, i) => row.map((val) => val * L[i])).slice(0, dimensions);

	return result[0].map((_, i) => result.map((row) => row[i]));
}
