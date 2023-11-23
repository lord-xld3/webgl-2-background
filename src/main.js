// main.js

import * as glUtils from './gl-utils.js';
import * as debug from './debug.js';
import { mat4 } from 'gl-matrix';

// Entry point
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
	throw new Error('WebGL2 not supported');
}

async function loadText(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`${response.status}, failed to fetch: ${url} `);
		}
		return response.text();
	} catch (error) {
		console.error(error);
	}

}

const vertexShaderSource = await loadText('shaders/vert.glsl');
const fragmentShaderSource = await loadText('shaders/phong.glsl');

// Create a shader program from vertex and fragment shader sources
const shaderProgram = glUtils.makeProgram(gl, vertexShaderSource, fragmentShaderSource);

// Get attribute and uniform locations
const attribs = glUtils.getAttribLocations(gl, shaderProgram, [
	'a_position',
	'a_color',
	'a_modelMatrix',
]);
const uniforms = glUtils.getUniformLocations(gl, shaderProgram, [
	'u_view',
	'u_projection',
	'u_lightPosition',
	'u_lightColor',
	'u_viewPosition',
	'u_ambientLight',
	'u_specular_power',
	'u_specularColor',
]);

// Create a vertex array object (attribute state)
const cubeVAO = gl.createVertexArray();
gl.bindVertexArray(cubeVAO);

// Define cube vertices
glUtils.makeBuffer(gl,
	new Float32Array([
		-1, -1, -1,
		1, -1, -1,
		1, 1, -1,
		-1, 1, -1,
		-1, -1, 1,
		1, -1, 1,
		1, 1, 1,
		-1, 1, 1,
	]), 
	gl.ARRAY_BUFFER, 
	gl.STATIC_DRAW
);

// Specify the position attribute for the vertices
glUtils.setAttribPointer(gl,
	attribs.a_position,
	{
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: 0,
		offset: 0,
	},
);

// Define cube indices
glUtils.makeBuffer(gl,
	new Uint16Array([
		0, 1, 2, 2, 3, 0, // Front face
		1, 5, 6, 6, 2, 1, // Right face
		5, 4, 7, 7, 6, 5, // Back face
		4, 0, 3, 3, 7, 4, // Left face
		3, 2, 6, 6, 7, 3, // Top face
		4, 5, 1, 1, 0, 4, // Bottom face
	]),
	gl.ELEMENT_ARRAY_BUFFER,
	gl.STATIC_DRAW
);
const numIndices = 36;

// Setup matrices, one per instance
const numInstances = 6;
const matrixData = new Float32Array(numInstances * 16);
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
	const byteOffsetToMatrix = i * 16 * 4; // 4 bytes per float
	const numFloatsForView = 16;
	matrices.push(new Float32Array(
		matrixData.buffer, 
		byteOffsetToMatrix, 
		numFloatsForView
	));
}

const matrixBuffer = glUtils.makeBuffer(gl, matrixData, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);

// Set attributes for each matrix
for (let i = 0; i < 6; i++) { // 4 attributes
	const location = attribs.a_modelMatrix + i;
	gl.enableVertexAttribArray(location);
	const offset = i * 16; // 4 floats per row, 4 bytes per float
	gl.vertexAttribPointer(
		location, // Attribute location
		4, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		false, // Normalized
		16 * 4, // Stride, 16 floats per matrix, 4 bytes per float
		offset // Offset
	);
	gl.vertexAttribDivisor(location, 1); // This attribute only changes for each 1 instance
}

// Setup a color for each instance
glUtils.makeBuffer(gl,
	new Float32Array([
		1, 0, 0, // Red
		0, 1, 0, // Green
		0, 0, 1, // Blue
		1, 1, 0, // Yellow
		0, 1, 1, // Cyan
		1, 0, 1, // Magenta
	]),
	gl.ARRAY_BUFFER,
	gl.STATIC_DRAW
);

// Set attributes for each color
glUtils.setAttribPointer(gl,
	attribs.a_color,
	{
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: 0,
		offset: 0,
	},
);
gl.vertexAttribDivisor(attribs.a_color, 1); // This attribute only changes for each 1 instance

// Setup uniforms and variables
let tick = 0;
let tickRate = 0.001;
let maxTick = Math.PI * 2;
let angle = tickRate * maxTick;
let ambientLight = [0.1, 0.1, 0.1],
lightPosition = [0, 0, 6],
lightColor = [1, 1, 1],
specular_power = 32,
specularColor = [1, 1, 1];

// View
let eyePosition = [0, 0, 6];
let targetPosition = [0, 0, 0];
let viewMatrix = mat4.lookAt(mat4.create(), 
	eyePosition,
	targetPosition, // Target position
	[0, 1, 0] // Up vector
);

// Projection
let fov = 50 * Math.PI / 180, aspect = canvas.width / canvas.height, near_plane = 0.1, far_plane = 10.0
let projectionMatrix = mat4.perspective(mat4.create(), 
	fov,
	aspect,
	near_plane,
	far_plane
);

// Pre-render
gl.useProgram(shaderProgram);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CW);

// Initialize uniforms
gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
gl.uniform3fv(uniforms.u_lightPosition, lightPosition);
gl.uniform3fv(uniforms.u_lightColor, lightColor);
gl.uniform3fv(uniforms.u_viewPosition, eyePosition);
gl.uniform3fv(uniforms.u_ambientLight, ambientLight);
gl.uniform1f(uniforms.u_specular_power, specular_power);
gl.uniform3fv(uniforms.u_specularColor, specularColor);
gl.uniformMatrix4fv(uniforms.u_projection, false, projectionMatrix);

// Resize the canvas when the window is resized
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
});

function toggleDisplay(element, button, display) {
    button.addEventListener('click', function() {
        if (element.style.display === 'none') {
            element.style.display = display;
        } else {
            element.style.display = 'none';
        }
    })
}

const overlayButton = document.getElementById('toggleOverlay');
const overlayElement = document.getElementById('overlay');

// Toggle to display controls
const controlsElement = document.getElementById('controls');
const controlsButton = document.getElementById('toggleControls');
toggleDisplay(controlsElement, controlsButton, 'flex');

// Special toggle for overlay/control buttons
overlayButton.addEventListener('click', () => {
	if (overlayElement.style.display === 'flex') {
		overlayElement.style.display = 'none';
		overlayButton.textContent = '<<';
		controlsButton.style.display = 'block';
	} else {
		overlayElement.style.display = 'flex';
		overlayButton.textContent = '>>';
		controlsButton.style.display = 'none';
		controlsElement.style.display = 'none';
	}
});

// Add debug controls
debug.setControl(controlsElement, 'Tick rate', 'range', 
	{ min: 0, max: 0.01, step: 0.0001, init: tickRate }, 
	(value) => { tickRate = value, angle = tickRate * maxTick; }
);

debug.setControl(controlsElement, 'Depth Test', 'checkbox',
	{ init: true },
	(value) => {
		if (value) {
			gl.enable(gl.DEPTH_TEST);
		} else {
			gl.disable(gl.DEPTH_TEST);
		}
	},
);

debug.setControl(controlsElement, 'Cull Face', 'checkbox',
	{ init: true },
	(value) => {
		if (value) {
			gl.enable(gl.CULL_FACE);
		} else {
			gl.disable(gl.CULL_FACE);
		}
	},
);

debug.setControl(controlsElement, 'Cull CW', 'checkbox',
	{ init: true },
	(value) => {
		if (value) {
			gl.frontFace(gl.CW);
		} else {
			gl.frontFace(gl.CCW);
		}
	},
);

// Translate the cubes
for (let i = 0; i < 6; i++) {
    mat4.identity(matrices[i]);
    mat4.translate(matrices[i], matrices[i], [
		-4 + 4 * (i % 3), // X
		((i + 1 & 4) - 2) * -0.75, // Y
		0 // Z
	]);
}

// Start the rendering loop
window.dispatchEvent(new Event('resize')); // Set the initial canvas size
render();

// Main rendering loop
function render() {

	// Clear the canvas
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	tick = (tick + tickRate) % maxTick;

	// Update the matrices
	for (let i=0; i < 3; i++) {
		// Top row
		mat4.rotate(matrices[i], matrices[i], 
			Math.sin(i + tick) * angle, // angle
			[1, -0.5, -1] // axis
		);
	}

	for (let i=3; i < 6; i++) {
		// Bottom row
		mat4.rotate(matrices[i], matrices[i], 
			Math.sin(i - tick) * angle, // angle
			[1, -0.5, -1] // axis
		);
	}

	// Upload the new matrix data
	gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

	// Draw the cube instances
	gl.drawElementsInstanced(
		gl.TRIANGLES, 
		numIndices, 
		gl.UNSIGNED_SHORT, 
		0, 
		numInstances
	);

	// Request the next frame
	requestAnimationFrame(render);
}