import { DimensionConfig, TesselationConfig } from '../interfaces';

export function getInputConfig(defaultTessConfig: TesselationConfig, defaultDimConfig: DimensionConfig): [TesselationConfig, DimensionConfig] {
	const milanoRadio = document.getElementById('milano') as HTMLInputElement;
	const smallMilanoRadio = document.getElementById('smallmilano') as HTMLInputElement;

	if (milanoRadio.checked) {
		defaultTessConfig.filePath = './data/MilanoData.csv';
	} else if (smallMilanoRadio.checked) {
		defaultTessConfig.filePath = './data/SmallMilanoData.csv';
	} else {
		const fileUpload = document.getElementById('file') as HTMLInputElement;

		if (fileUpload.files && fileUpload.files.length > 0) {
			defaultTessConfig.filePath = URL.createObjectURL(fileUpload.files[0]);
		} else {
			defaultTessConfig.filePath = './data/MilanoData.csv';
		}
	}

	const maxRadius = document.getElementById('max-radius') as HTMLInputElement;
	defaultTessConfig.maxRadius = Number(maxRadius.value);

	const numTopics = document.getElementById('num-topics') as HTMLInputElement;
	defaultDimConfig.numTopics = Number(numTopics.value);

	const computeButton = document.getElementById('compute') as HTMLButtonElement;
	computeButton.disabled = true;
	computeButton.textContent = 'Computing...';

	return [defaultTessConfig, defaultDimConfig];
}
