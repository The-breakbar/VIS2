import * as d3 from 'd3';

// convert to colors from a Cube Diagonal Cut B-C-Y-R color map
export function convertTopicColors(topicColorCoords: number[][]) {
	return topicColorCoords.map((coord) => {
		const colors = [
			[0, 0, 255],
			[0, 255, 255],
			[255, 255, 0],
			[255, 0, 0]
		];

		// the coords should be between -1 and 1
		const x = (coord[0] + 1) / 2;
		const y = (coord[1] + 1) / 2;

		// consider the 4 colors as the 4 corners of a square
		// interpolate the point between the 4 corners
		const color = [];
		for (let i = 0; i < 3; i++) {
			color[i] = colors[0][i] * (1 - x) * (1 - y) + colors[1][i] * x * (1 - y) + colors[2][i] * x * y + colors[3][i] * (1 - x) * y;
		}

		return d3.rgb(color[0], color[1], color[2]);
	});
}
