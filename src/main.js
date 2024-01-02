// main.js

import * as glUtils from './gl-utils.js';
import { mat4 } from 'gl-matrix';

// Entry point
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
	throw new Error('WebGL2 not supported');
}

console.log(`Renderer: ${gl.getParameter(gl.RENDERER)}`);
console.log(`Vendor: ${gl.getParameter(gl.VENDOR)}`);

const vsShader = await fetch('./shaders/water.vert').then(res => res.text());
const fsShader = await fetch('./shaders/water.frag').then(res => res.text());

const shaderProgram = glUtils.makeProgram(gl, vsShader, fsShader);

const attribs = glUtils.getAttribLocations(gl, shaderProgram,
	[
		'a_position', 
		'a_texcoord',
	]
);

// Define the uniform buffer data
const uniformBufferData = new Float32Array([
	// Model matrix
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,

	// View matrix
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,

	// Projection matrix
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,

	// Tick value
	0,
]);

const uniformBuffer = glUtils.makeBuffer(gl,
	uniformBufferData,
	gl.UNIFORM_BUFFER,
	gl.DYNAMIC_DRAW
);

// Bind the uniform buffer object to the shader program
const uniformBlockIndex = gl.getUniformBlockIndex(shaderProgram, 'uniformStruct');
gl.uniformBlockBinding(shaderProgram, uniformBlockIndex, 0);

// Bind the uniform buffer object to the binding point 0
gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformBuffer);

const cubeVAO = gl.createVertexArray();
gl.bindVertexArray(cubeVAO);

let bufferStride = 5 * Float32Array.BYTES_PER_ELEMENT;
glUtils.makeBuffer(gl,
	new Float32Array([
		// Front face
		-1,-1, 1, 0, 1,
		 1,-1, 1, 1, 1,
		 1, 1, 1, 1, 0,
		-1,-1, 1, 0, 1,
		 1, 1, 1, 1, 0,
		-1, 1, 1, 0, 0,

		// Back face
		-1,-1,-1, 0, 1,
		 1,-1,-1, 1, 1,
		 1, 1,-1, 1, 0,
		-1,-1,-1, 0, 1,
		 1, 1,-1, 1, 0,
		-1, 1,-1, 0, 0,

		// Top face
		-1, 1,-1, 0, 0,
		 1, 1,-1, 1, 0,
		 1, 1, 1, 1, 1,
		-1, 1,-1, 0, 0,
		 1, 1, 1, 1, 1,
		-1, 1, 1, 0, 1,

		// Bottom face
		-1,-1,-1, 0, 1,
		 1,-1,-1, 1, 1,
		 1,-1, 1, 1, 0,
		-1,-1,-1, 0, 1,
		 1,-1, 1, 1, 0,
		-1,-1, 1, 0, 0,

		// Right face
		 1,-1,-1, 1, 1,
		 1, 1,-1, 1, 0,
		 1, 1, 1, 0, 0,
		 1,-1,-1, 1, 1,
		 1, 1, 1, 0, 0,
		 1,-1, 1, 0, 1,

		// Left face
		-1,-1,-1, 0, 1,
		-1, 1,-1, 0, 0,
		-1, 1, 1, 1, 0,
		-1,-1,-1, 0, 1,
		-1, 1, 1, 1, 0,
		-1,-1, 1, 1, 1,
	]),
	gl.ARRAY_BUFFER,
	gl.STATIC_DRAW
);

glUtils.setAttribPointer(gl, 
	attribs.a_position, 
	{
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: bufferStride,
		offset: 0,
	}
);

glUtils.setAttribPointer(gl,
	attribs.a_texcoord,
	{
		size: 2,
		type: gl.FLOAT,
		normalize: false,
		stride: bufferStride,
		offset: 3 * Float32Array.BYTES_PER_ELEMENT,
	}
);

gl.bindVertexArray(null);

// Textures
const textures = [
    {
        src: 'img/water.png',
		params: {
			TEXTURE_MIN_FILTER: gl.LINEAR_MIPMAP_LINEAR,
			TEXTURE_MAG_FILTER: gl.LINEAR,
		}
    },
];

glUtils.loadTextures(gl, textures);

// Model
const modelMatrix = mat4.create();
mat4.rotate(modelMatrix, modelMatrix, Math.PI / 4, [1, 1, 0]);

// View
let cameraPosition = [0, 0, 2];
const viewMatrix = mat4.lookAt(mat4.create(), cameraPosition, [0, 0, 0], [0, 1, 0]);

// Projection
const projectionMatrix = mat4.create();

window.addEventListener('resize', function () {
	gl.canvas.width = window.innerWidth;
	gl.canvas.height = window.innerHeight;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	mat4.perspective(projectionMatrix, Math.PI / 1.5, gl.canvas.width / gl.canvas.height, 0.1, 100);
	uniformBufferData.set(projectionMatrix, 32);
})

gl.useProgram(shaderProgram);
let tickspeed = 0.0001;
let tick = 0;
let maxTick = Math.PI * 2;
// Disable to fix transparency issues when object is transparent on multiple sides
// gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

gl.bindVertexArray(cubeVAO);
uniformBufferData.set(modelMatrix, 0);
uniformBufferData.set(viewMatrix, 16);
uniformBufferData.set(projectionMatrix, 32);

window.dispatchEvent(new Event('resize'));
render();

function render() {
	// Clear screen
	gl.clearColor(0.4, 0.2, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Actual logic
	tick = (tick + tickspeed) % maxTick;
	mat4.rotate(modelMatrix, modelMatrix, tickspeed * 10, [1,1,0]);
	
	// Update uniform buffer data
	uniformBufferData.set(modelMatrix, 0);
	uniformBufferData[48] = tick;

	// Copy data to uniform buffer
	gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
	gl.bufferSubData(gl.UNIFORM_BUFFER, 0, uniformBufferData);
	gl.bindBuffer(gl.UNIFORM_BUFFER, null);

	// Render
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	requestAnimationFrame(render);
}