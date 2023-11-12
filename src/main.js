// main.js

import * as glUtils from './gl-utils.js';
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
	uniform float u_shininess;
	uniform vec3 u_specularColor;

	out vec4 outColor;

	void main() {
		vec3 normal = normalize(v_normal);
		vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
		vec3 surfaceToViewDirection = normalize(v_surfaceToView);
		float light = max(dot(normal, surfaceToLightDirection), 0.0);
		vec3 reflection = reflect(-surfaceToLightDirection, normal);
		vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
		float specular = pow(max(dot(reflection, halfVector), 0.0), u_shininess);
		vec3 lightWeighting = u_lightColor * v_color * light + u_specularColor * specular;
		vec3 ambient = u_ambientLight * v_color;
		outColor = vec4(lightWeighting + ambient, 1.0);
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
	'u_shininess',
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

// View
const eyePosition = [0, 0, 6];
const viewMatrix = mat4.lookAt(mat4.create(), 
	eyePosition,
	[0, 0, 0], // Target position
	[0, 1, 0] // Up vector
);

// Projection
const projectionMatrix = mat4.perspective(mat4.create(), 
	45, // Field of view
	canvas.width / canvas.height, // Aspect ratio
	0.1, // Near
	100 // Far
);

// Resize the canvas when the window is resized
window.addEventListener('resize', function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
});

// Pre-render setup
let tick = 0;
let tickRate = 0.001;
let maxTick = 2 * Math.PI; // 360 degrees

gl.useProgram(shaderProgram);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CW);

gl.uniformMatrix4fv(uniforms.u_view, false, viewMatrix);
gl.uniform3fv(uniforms.u_lightPosition, eyePosition);
gl.uniform3fv(uniforms.u_lightColor, [1.0, 1.0, 1.0]);
gl.uniform3fv(uniforms.u_viewPosition, eyePosition);
gl.uniform3fv(uniforms.u_ambientLight, [0.2, 0.2, 0.2]);
gl.uniform1f(uniforms.u_shininess, 16.0);
gl.uniform3fv(uniforms.u_specularColor, [1, 1, 1]);

// Start the rendering loop
window.dispatchEvent(new Event('resize')); // Set the initial canvas size
render();

// Main rendering loop
function render() {

	// Clear the canvas
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Upload the projection matrix in case it changed
	gl.uniformMatrix4fv(uniforms.u_projection, false, projectionMatrix);

	tick = (tick + tickRate) % maxTick;

	// Update the matrices
	for (let i=0; i < 3; i++) {
		// Top row
		mat4.identity(matrices[i]);
		mat4.translate(matrices[i], matrices[i], [-4 + 4 * i, 1.5, 0]);
		mat4.rotate(matrices[i], matrices[i], 
			Math.sin(tick * (i + 1)) * Math.PI * 2, // angle
			[1, -0.5, -1] // axis
		);
	}

	for (let i=3; i < 6; i++) {
		// Bottom row
		mat4.identity(matrices[i]);
		mat4.translate(matrices[i], matrices[i], [-4 + 4 * (i % 3), -1.5, 0]);
		mat4.rotate(matrices[i], matrices[i], 
			Math.sin(tick * (i)) * Math.PI * -2, // angle
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