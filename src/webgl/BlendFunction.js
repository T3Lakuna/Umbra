import { ONE, ZERO } from "./constants.js";

export class BlendFunction {
	constructor(gl, source = ONE, destination = ZERO, sourceAlpha, destinationAlpha) {
		// TODO: This class can be cleaned up once Bundlephobia supports private methods and properties.

		const update = () => {
			if (sourceAlpha) {
				gl.blendFuncSeparate(source, destination, sourceAlpha, destinationAlpha);
			} else {
				gl.blendFunc(source, destination);
			}
		};

		this.gl = gl;
		this.update = update;

		Object.defineProperties(this, {
			source: {
				get: () => source,
				set: (value) => {
					source = value;
					update();
				}
			},
			destination: {
				get: () => destination,
				set: (value) => {
					destination = value;
					update();
				}
			},
			sourceAlpha: {
				get: () => sourceAlpha,
				set: (value) => {
					sourceAlpha = value;
					update();
				}
			},
			destinationAlpha: {
				get: () => destinationAlpha,
				set: (value) => {
					destinationAlpha = value;
					update();
				}
			}
		});

		update();
	}
}