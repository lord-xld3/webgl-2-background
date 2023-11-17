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

const vertexShaderSource = `#version 300 es
	in vec4 a_position;
	in vec3 a_color;
	in mat4 a_modelMatrix;
	
	uniform mat4 u_view;
	uniform mat4 u_projection;
	uniform vec3 u_lightPosition;
	uniform vec3 u_viewPosition;

	out vec3 v_normal;
	out vec3 v_color;
	out vec3 v_surfaceToLight;
	out vec3 v_surfaceToView;

	void main() {
		vec4 worldPosition = a_modelMatrix * a_position;
		gl_Position = u_projection * u_view * worldPosition;
		v_normal = mat3(a_modelMatrix) * a_position.xyz;
		v_color = a_color;
		v_surfaceToLight = u_lightPosition - worldPosition.xyz;
		v_surfaceToView = u_viewPosition - worldPosition.xyz;
	}
`;

const fragmentShaderSource = `#version 300 es
	precision highp float;
	
	in vec3 v_normal;
	in vec3 v_color;
	in vec3 v_surfaceToLight;
	in vec3 v_surfaceToView;
	
	uniform vec3 u_lightColor;
	uniform vec3 u_ambientLight;
	uniform float u_specular_power;
	uniform vec3 u_specularColor;

	out vec4 outColor;

	void main() {
		vec3 normal = normalize(v_normal);
		vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
		vec3 lightIntensity = 
			
			// Diffuse lighting
			u_lightColor * v_color * max(dot(normal, surfaceToLightDirection), 0.0) 
			
			// Specular lighting
			+ u_specularColor * pow(
				max(
					dot(
						reflect(-surfaceToLightDirection, normal),
						normalize(v_surfaceToView)
					),
					0.0
				),
				u_specular_power
			);

		outColor = vec4(lightIntensity + u_ambientLight * v_color, 1.0);
	}
`;

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

// Resize the canvas when the window is resized
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
});

const overlayButton = document.getElementById('toggleOverlay');
const overlayElement = document.getElementById('overlay');

// Toggle to display controls
const controlsElement = document.getElementById('controls');
const controlsButton = document.getElementById('toggleControls');
debug.toggleDisplay(controlsElement, controlsButton, 'flex');

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

// Add debug controls
debug.setControl(controlsElement, 'Tick rate', 'range', 
	{ min: 0, max: 0.01, step: 0.0001, init: tickRate }, 
	(value) => { tickRate = value, angle = tickRate * maxTick; }
);

debug.setControl(controlsElement, 'View X', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		eyePosition[0] = value;
		gl.uniform3fv(uniforms.u_viewPosition, eyePosition);
		viewMatrix = mat4.lookAt(mat4.create(),
			eyePosition,
			targetPosition,
			[0, 1, 0]
		);
		gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
	}
);

debug.setControl(controlsElement, 'View Y', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		eyePosition[1] = value;
		gl.uniform3fv(uniforms.u_viewPosition, eyePosition);
		viewMatrix = mat4.lookAt(mat4.create(),
			eyePosition,
			targetPosition,
			[0, 1, 0]
		);
		gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
	}
);

debug.setControl(controlsElement, 'View Z', 'range',
	{ min: -10, max: 10, step: 0.1, init: 6 },
	(value) => {
		eyePosition[2] = value;
		gl.uniform3fv(uniforms.u_viewPosition, eyePosition);
		viewMatrix = mat4.lookAt(mat4.create(),
			eyePosition,
			targetPosition,
			[0, 1, 0]
		);
		gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
	}
);

debug.setControl(controlsElement, 'Target X', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		targetPosition[0] = value;
		viewMatrix = mat4.lookAt(mat4.create(),
			eyePosition,
			targetPosition,
			[0, 1, 0]
		);
		gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
	}
);

debug.setControl(controlsElement, 'Target Y', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		targetPosition[1] = value;
		viewMatrix = mat4.lookAt(mat4.create(),
			eyePosition,
			targetPosition,
			[0, 1, 0]
		);
		gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
	}
);

debug.setControl(controlsElement, 'Target Z', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		targetPosition[2] = value;
		viewMatrix = mat4.lookAt(mat4.create(),
			eyePosition,
			targetPosition,
			[0, 1, 0]
		);
		gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
	}
);

debug.setControl(controlsElement, 'FOV', 'range',
	{ min: 0, max: 180, step: 1, init: 50 },
	(value) => {
		fov = value * Math.PI / 180;
		projectionMatrix = mat4.perspective(mat4.create(),
			fov, aspect, near_plane, far_plane
		);
		gl.uniformMatrix4fv(uniforms.u_projection, false, projectionMatrix);
	}
);

debug.setControl(controlsElement, 'Aspect', 'range',
	{ min: 0, max: 10, step: 0.1, init: aspect },
	(value) => {
		aspect = value;
		projectionMatrix = mat4.perspective(mat4.create(),
			fov, aspect, near_plane, far_plane
		);
		gl.uniformMatrix4fv(uniforms.u_projection, false, projectionMatrix);
	},
);

debug.setControl(controlsElement, 'Near plane', 'range',
	{ min: 0.1, max: 10.0, step: 0.1, init: 0.1 },
	(value) => {
		near_plane = value;
		projectionMatrix = mat4.perspective(mat4.create(),
			fov, aspect, near_plane, far_plane
		);
		gl.uniformMatrix4fv(uniforms.u_projection, false, projectionMatrix);
	},
);

debug.setControl(controlsElement, 'Far plane', 'range',
	{ min: 0.2, max: 20.0, step: 0.1, init: 10.0 },
	(value) => {
		far_plane = value;
		projectionMatrix = mat4.perspective(mat4.create(),
			fov, aspect, near_plane, far_plane
		);
		gl.uniformMatrix4fv(uniforms.u_projection, false, projectionMatrix);
	},
);

debug.setControl(controlsElement, 'Light X', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		lightPosition[0] = value;
		gl.uniform3fv(uniforms.u_lightPosition, lightPosition);
	},
);

debug.setControl(controlsElement, 'Light Y', 'range',
	{ min: -10, max: 10, step: 0.1, init: 0 },
	(value) => {
		lightPosition[1] = value;
		gl.uniform3fv(uniforms.u_lightPosition, lightPosition);
	},
);

debug.setControl(controlsElement, 'Light Z', 'range',
	{ min: -10, max: 10, step: 0.1, init: 6 },
	(value) => {
		lightPosition[2] = value;
		gl.uniform3fv(uniforms.u_lightPosition, lightPosition);
	},
);

debug.setControl(controlsElement, 'Light R', 'range',
	{ min: 0, max: 1, step: 0.01, init: 1 },
	(value) => {
		lightColor[0] = value;
		gl.uniform3fv(uniforms.u_lightColor, lightColor);
	},
);

debug.setControl(controlsElement, 'Light G', 'range',
	{ min: 0, max: 1, step: 0.01, init: 1 },
	(value) => {
		lightColor[1] = value;
		gl.uniform3fv(uniforms.u_lightColor, lightColor);
	},
);

debug.setControl(controlsElement, 'Light B', 'range',
	{ min: 0, max: 1, step: 0.01, init: 1 },
	(value) => {
		lightColor[2] = value;
		gl.uniform3fv(uniforms.u_lightColor, lightColor);
	},
);

debug.setControl(controlsElement, 'Ambient R', 'range',
	{ min: 0, max: 1, step: 0.01, init: 0.1 },
	(value) => {
		ambientLight[0] = value;
		gl.uniform3fv(uniforms.u_ambientLight, ambientLight);
	},
);

debug.setControl(controlsElement, 'Ambient G', 'range',
	{ min: 0, max: 1, step: 0.01, init: 0.1 },
	(value) => {
		ambientLight[1] = value;
		gl.uniform3fv(uniforms.u_ambientLight, ambientLight);
	},
);

debug.setControl(controlsElement, 'Ambient B', 'range',
	{ min: 0, max: 1, step: 0.01, init: 0.1 },
	(value) => {
		ambientLight[2] = value;
		gl.uniform3fv(uniforms.u_ambientLight, ambientLight);
	},
);

debug.setControl(controlsElement, 'Specular power', 'range',
	{ min: 0, max: 64, step: 0.5, init: 32 },
	(value) => {
		specular_power = value;
		gl.uniform1f(uniforms.u_specular_power, specular_power);
	},
);

debug.setControl(controlsElement, 'Specular R', 'range',
	{ min: 0, max: 1, step: 0.01, init: 1 },
	(value) => {
		specularColor[0] = value;
		gl.uniform3fv(uniforms.u_specularColor, specularColor);
	},
);

debug.setControl(controlsElement, 'Specular G', 'range',
	{ min: 0, max: 1, step: 0.01, init: 1 },
	(value) => {
		specularColor[1] = value;
		gl.uniform3fv(uniforms.u_specularColor, specularColor);
	},
);

debug.setControl(controlsElement, 'Specular B', 'range',
	{ min: 0, max: 1, step: 0.01, init: 1 },
	(value) => {
		specularColor[2] = value;
		gl.uniform3fv(uniforms.u_specularColor, specularColor);
	},
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

// Translate the matrices
for (let i = 0; i < 3; i++) {
    // Top row
    mat4.identity(matrices[i]);
    mat4.translate(matrices[i], matrices[i], [-4 + 4 * i, 1.5, 0]);
}

for (let i = 3; i < 6; i++) {
    // Bottom row
    mat4.identity(matrices[i]);
    mat4.translate(matrices[i], matrices[i], [-4 + 4 * (i % 3), -1.5, 0]);
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