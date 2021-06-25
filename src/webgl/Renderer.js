import { ONE, ZERO, FUNC_ADD, CCW, LESS, MAX_COMBINED_TEXTURE_IMAGE_UNITS, MAX_TEXTURE_MAX_ANISOTROPY_EXT, TEXTURE0,
	FRAMEBUFFER, DEPTH_TEST, COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, STENCIL_BUFFER_BIT } from "./constants.js";
import { makeFullscreenCanvas } from "./makeFullscreenCanvas.js";

let nextRendererId = 0;

export class Renderer {
	constructor({ canvas = makeFullscreenCanvas(), width = 300, height = 150, dpr = 1, alpha = false,
		depth = true, stencil = false, antialias = false, premultipliedAlpha = false, preserveDrawingBuffer = false,
		powerPreference = "default", autoClear = true } = {}) {

		const gl = canvas.getContext("webgl2", { alpha, depth, stencil, antialias, premultipliedAlpha, preserveDrawingBuffer, powerPreference });

		Object.assign(this, {
			dpr, alpha, color: true, depth, stencil, premultipliedAlpha, autoClear, id: nextRendererId++, gl,
			state: {
				blendFunction: { source: ONE, destination: ZERO },
				blendEquation: { modeRGB: FUNC_ADD },
				/* cullFace: null, */ frontFace: CCW, depthMask: true, depthFunction: LESS, premultiplyAlpha: false, flipY: false, unpackAlignment: 4, /* framebuffer: null, */
				viewport: { /* width: null, */ /* height: null */ },
				textureUnits: [],
				activeTextureUnit: 0,
				/* boundBuffer: null, */
				uniformLocations: new Map()
			},
			extensions: {},
			parameters: { maxTextureUnits: gl.getParameter(MAX_COMBINED_TEXTURE_IMAGE_UNITS), maxAnisotropy: gl.getParameter(MAX_TEXTURE_MAX_ANISOTROPY_EXT) }
		});

		// Initialize canvas size.
		this.setSize(width, height);

		// Initialize extra format types.
		["EXT_color_buffer_float", "OES_texture_float_linear"].forEach((extensionName) => this.extensions[extensionName] = gl.getExtension(extensionName));

		// Create method aliases.
		["vertexAttribDivisor", "drawArraysInstanced", "drawElementsInstanced", "createVertexArray", "bindVertexArray", "deleteVertexArray", "drawBuffers"]
			.forEach((methodName) => this[methodName] = gl[methodName].bind(gl));
	}

	setSize(width, height) {
		Object.assign(this, { width, height });
		Object.assign(this.gl.canvas, { width: width * this.dpr, height: height * this.dpr });
		Object.assign(this.gl.canvas.style, { width: `${width}px`, height: `${height}px` });
	}

	setViewport(width, height) {
		if (this.state.viewport.width == width && this.state.viewport.height == height) { return; }
		Object.assign(this.state.viewport, { width, height });
		this.gl.viewport(0, 0, width, height);
	}

	setEnabled(id, enable) {
		if (enable) { this.gl.enable(id); } else { this.gl.disable(id); }
		this.state[id] = enable;
	}

	setBlendFunction(source, destination, sourceAlpha, destinationAlpha) {
		Object.assign(this.state.blendFunction, { source, destination, sourceAlpha, destinationAlpha });
		if (sourceAlpha) { this.gl.blendFuncSeparate(source, destination, sourceAlpha, destinationAlpha); } else { this.gl.blendFunc(source, destination); }
	}

	setCullFace(value) {
		this.state.cullFace = value;
		this.gl.cullFace(value);
	}

	setFrontFace(value) {
		this.state.frontFace = value;
		this.gl.frontFace(value);
	}

	setDepthMask(value) {
		this.state.depthMask = value;
		this.gl.depthMask(value);
	}

	setDepthFunction(value) {
		this.state.depthFunction = value;
		this.gl.depthFunc(value);
	}

	activeTexture(value) {
		this.state.activeTextureUnit = value;
		this.gl.activeTexture(TEXTURE0 + value);
	}

	bindFramebuffer(target = FRAMEBUFFER, buffer) {
		this.state.framebuffer = buffer;
		this.gl.bindFramebuffer(target, buffer);
	}

	getRenderList({ scene, camera, frustumCull, sort } = {}) {
		let renderList = [];

		// Frustum culling.
		if (camera && frustumCull) { camera.updateFrustum(); }

		// Get visible nodes.
		scene.traverse((node) => {
			if (!node.visible) { return true; }
			if (!node.draw) { return; }

			// Can be minified with optional chaining once Bundlephobia supports it.
			if (frustumCull && node.frustumCulled && camera) {
				if (!camera.frustumIntersectsMesh(node)) { return; }
			}

			renderList.push(node);
		});

		// Organize nodes into three render groups (opaque, transparent, UI).
		if (sort) {
			const opaqueRenderGroup = [];
			const transparentRenderGroup = [];
			const uiRenderGroup = [];
			renderList.forEach((node) => {
				if (!node.program.transparent) {
					opaqueRenderGroup.push(node);
				} else if (node.program.depthTest) {
					transparentRenderGroup.push(node);
				} else {
					uiRenderGroup.push(node);
				}

				// Calculate Z depth.
				node.zDepth = (node.renderOrder != 0 || !node.program.depthTest || !camera)
					? 0
					: node.zDepth = node.worldMatrix.translation.transform(camera.projectionViewMatrix)[2];
			});

			// Sort and concatenate.
			opaqueRenderGroup.sort((a, b) => a.renderOrder - b.renderOrder || a.program.id - b.program.id || a.zDepth - b.zDepth || b.id - a.id);
			transparentRenderGroup.sort((a, b) => a.renderOrder - b.renderOrder || b.zDepth - a.zDepth || b.id - a.id);
			uiRenderGroup.sort((a, b) => a.renderOrder - b.renderOrder || a.program.id - b.program.id || b.id - a.id);
			renderList = opaqueRenderGroup.concat(transparentRenderGroup, uiRenderGroup);
		}

		return renderList;
	}

	render({ scene, camera, frustumCull = true, sort = true, target, update = true, clear } = {}) {
		this.bindFramebuffer(target);
		this.setViewport(this.width * (target ? 1 : this.dpr), this.height * (target ? 1 : this.dpr));
		
		// Clear the screen.
		if (clear ?? this.autoClear) {
			if (this.depth && (!target || target.depth)) {
				this.enable(DEPTH_TEST);
				this.setDepthMask(true);
			}

			this.gl.clear(
				(this.color ? COLOR_BUFFER_BIT : 0)
				| (this.depth ? DEPTH_BUFFER_BIT : 0)
				| (this.stencil ? STENCIL_BUFFER_BIT : 0));
		}

		// Update all scene graph matrices.
		if (update) { scene.updateMatrixWorld(); }

		// Update the camera separately in case it isn't in the scene graph.
		if (camera) { camera.updateMatrixWorld(); }

		// Get render list and draw.
		this.getRenderList({ scene, camera, frustumCull, sort }).forEach((node) => node.draw({ camera }));
	}
}