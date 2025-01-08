import * as d3 from 'd3';

function interpolateColor(color1: number[], color2: number[], t: number): number[] {
	return color1.map((c1, i) => Math.round((1 - t) * c1 + t * color2[i]));
}

function getHSLColor(x: number, y: number): d3.RGBColor {
	const h = y * 360;
	const s = 0.6 + 0.4 * x;
	const l = 0.5;

	return d3.hsl(h, s, l).rgb();
}

// convert to colors from a Cube Diagonal Cut B-C-Y-R color map
export function convertTopicColors(topicColorCoords: number[][]): d3.RGBColor[] {
	const minX = Math.min(...topicColorCoords.map((coord) => coord[0]));
	const minY = Math.min(...topicColorCoords.map((coord) => coord[1]));
	const maxX = Math.max(...topicColorCoords.map((coord) => coord[0]));
	const maxY = Math.max(...topicColorCoords.map((coord) => coord[1]));

	return topicColorCoords.map((coord) => {
		// normalize from to [0, 1]
		const x = (coord[0] - minX) / (maxX - minX);
		const y = (coord[1] - minY) / (maxY - minY);

		return getHSLColor(x, y);

		// Compute t value (projection onto diagonal)
		const t = (x + y) / 2;

		// Define key colors as [R, G, B]
		const colors = {
			blue: [0, 0, 255], // Blue
			cyan: [0, 255, 255], // Cyan
			yellow: [255, 255, 0], // Yellow
			red: [255, 0, 0] // Red
		};

		// Interpolate color based on t value
		let rgb: number[];
		if (t <= 0.33) {
			const tLocal = t / 0.33;
			rgb = interpolateColor(colors.blue, colors.cyan, tLocal);
		} else if (t <= 0.66) {
			const tLocal = (t - 0.33) / 0.33;
			rgb = interpolateColor(colors.cyan, colors.yellow, tLocal);
		} else {
			const tLocal = (t - 0.66) / 0.34;
			rgb = interpolateColor(colors.yellow, colors.red, tLocal);
		}

		return d3.rgb(rgb[0], rgb[1], rgb[2]);
	});
}
