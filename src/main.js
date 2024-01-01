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

const vsShader = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform float u_tick;

out vec2 v_texcoord;
out float v_tick;

void main() {
	vec4 modelViewPosition = u_viewMatrix * u_modelMatrix * a_position;
	gl_Position = u_projectionMatrix * modelViewPosition;
	v_texcoord = a_texcoord;
	v_tick = u_tick;
}`;

const fsShader = `#version 300 es
precision highp float;

in vec2 v_texcoord;
in float v_tick;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
	// 'Scroll' texcoords
	vec2 scroll1 = v_texcoord + vec2(v_tick, v_tick * 4.0);
	vec2 scroll2 = v_texcoord + vec2(-v_tick + 0.5, v_tick * 4.0 + 0.5);

    // Textures
	vec3 tex1 = texture(u_texture, scroll1).rgb;
	vec3 tex2 = texture(u_texture, scroll2).rgb;

	outColor = vec4(tex1 * tex2, 0.5);
}`;

const shaderProgram = glUtils.makeProgram(gl, vsShader, fsShader);

const attribs = glUtils.getAttribLocations(gl, shaderProgram,
	[
		'a_position', 
		'a_texcoord',
	]
);

const uniforms = glUtils.getUniformLocations(gl, shaderProgram,
	[
		'u_modelMatrix',
		'u_viewMatrix',
		'u_projectionMatrix',
		'u_texture',
		'u_tick',
	]
);

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
	gl.uniformMatrix4fv(uniforms.u_projectionMatrix, false, projectionMatrix);
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
gl.uniformMatrix4fv(uniforms.u_modelMatrix, false, modelMatrix);
gl.uniformMatrix4fv(uniforms.u_viewMatrix, false, viewMatrix);

window.dispatchEvent(new Event('resize'));
render();

function render() {
	// Clear screen
	gl.clearColor(0.4, 0.2, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Actual logic
	tick = (tick + tickspeed) % maxTick;
	mat4.rotate(modelMatrix, modelMatrix, tickspeed * 10, [1,1,0]);
	
	// Update uniforms
	gl.uniformMatrix4fv(uniforms.u_modelMatrix, false, modelMatrix);
	gl.uniform1f(uniforms.u_tick, tick);

	// Render
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	requestAnimationFrame(render);
}