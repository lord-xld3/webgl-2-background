// main.js

import * as glUtils from './gl-utils.js';
import { mat4 } from 'gl-matrix';

// Entry point
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
	throw new Error('WebGL2 not supported');
}

const vsShader = `#version 300 es
in vec4 a_position;
in vec3 a_color;
in vec2 a_texcoord;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

out vec3 v_color;
out vec2 v_texcoord;

void main() {
	gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
	v_color = a_color;
	v_texcoord = a_texcoord;
}`;

const fsShader = `#version 300 es
precision highp float;
in vec3 v_color;
in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
	outColor = vec4(v_color, 1) * texture(u_texture, v_texcoord);
}`;

const shaderProgram = glUtils.makeProgram(gl, vsShader, fsShader);

const attribs = glUtils.getAttribLocations(gl, shaderProgram,
	[
		'a_position', 
		'a_color',
		'a_texcoord',
	]
);

const uniforms = glUtils.getUniformLocations(gl, shaderProgram,
	[
		'u_modelViewMatrix',
		'u_projectionMatrix',
		'u_texture',
	]
);

glUtils.makeBuffer(gl,
	new Float32Array([
		// Front face
		-1,-1, 1, 1, 0, 0, 0, 1,
		 1,-1, 1, 0, 1, 0, 1, 1,
		 1, 1, 1, 0, 0, 1, 1, 0,
		-1,-1, 1, 1, 0, 0, 0, 1,
		 1, 1, 1, 0, 0, 1, 1, 0,
		-1, 1, 1, 1, 1, 0, 0, 0,

		// Back face
		-1,-1,-1, 1, 0, 0, 0, 1,
		 1,-1,-1, 0, 1, 0, 0, 0,
		 1, 1,-1, 0, 0, 1, 1, 0,
		-1,-1,-1, 1, 0, 0, 0, 1,
		 1, 1,-1, 0, 0, 1, 1, 0,
		-1, 1,-1, 1, 1, 0, 1, 1,

		// Top face
		-1, 1,-1, 1, 0, 0, 0, 1,
		 1, 1,-1, 0, 1, 0, 0, 0,
		 1, 1, 1, 0, 0, 1, 1, 0,
		-1, 1,-1, 1, 0, 0, 0, 1,
		 1, 1, 1, 0, 0, 1, 1, 0,
		-1, 1, 1, 1, 1, 0, 1, 1,

		// Bottom face
		-1,-1,-1, 1, 0, 0, 0, 1,
		 1,-1,-1, 0, 1, 0, 1, 1,
		 1,-1, 1, 0, 0, 1, 1, 0,
		-1,-1,-1, 1, 0, 0, 0, 1,
		 1,-1, 1, 0, 0, 1, 1, 0,
		-1,-1, 1, 1, 1, 0, 0, 0,

		// Right face
		 1,-1,-1, 1, 0, 0, 0, 1,
		 1, 1,-1, 0, 1, 0, 1, 1,
		 1, 1, 1, 0, 0, 1, 1, 0,
		 1,-1,-1, 1, 0, 0, 0, 1,
		 1, 1, 1, 0, 0, 1, 1, 0,
		 1,-1, 1, 1, 1, 0, 0, 0,

		// Left face
		-1,-1,-1, 1, 0, 0, 0, 1,
		-1, 1,-1, 0, 1, 0, 0, 0,
		-1, 1, 1, 0, 0, 1, 1, 0,
		-1,-1,-1, 1, 0, 0, 0, 1,
		-1, 1, 1, 0, 0, 1, 1, 0,
		-1,-1, 1, 1, 1, 0, 1, 1,
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
		stride: 8 * Float32Array.BYTES_PER_ELEMENT,
		offset: 0,
	}
);

glUtils.setAttribPointer(gl, 
	attribs.a_color, 
	{
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: 8 * Float32Array.BYTES_PER_ELEMENT,
		offset: 3 * Float32Array.BYTES_PER_ELEMENT,
	}
);

glUtils.setAttribPointer(gl,
	attribs.a_texcoord,
	{
		size: 2,
		type: gl.FLOAT,
		normalize: false,
		stride: 8 * Float32Array.BYTES_PER_ELEMENT,
		offset: 6 * Float32Array.BYTES_PER_ELEMENT,
	}
);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

var image = new Image();
image.src = 'img/myself.jpg'
image.onload = function() {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

gl.enable(gl.DEPTH_TEST);
gl.cullFace(gl.BACK);
gl.useProgram(shaderProgram);

// ModelView
const modelViewMatrix = mat4.create();
mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);
mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 4, [1, 1, 1]);

// Projection
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);

window.addEventListener('resize', function () {
	gl.canvas.width = window.innerWidth;
	gl.canvas.height = window.innerHeight;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);
	gl.uniformMatrix4fv(uniforms.u_projectionMatrix, false, projectionMatrix);
})

gl.uniformMatrix4fv(uniforms.u_modelViewMatrix, false, modelViewMatrix);
gl.uniformMatrix4fv(uniforms.u_projectionMatrix, false, projectionMatrix);

let tickspeed = 0.01;

function render() {
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(shaderProgram);

	mat4.rotate(modelViewMatrix, modelViewMatrix, tickspeed, [0.5,1,1.5]);
	gl.uniformMatrix4fv(uniforms.u_modelViewMatrix, false, modelViewMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	requestAnimationFrame(render);
}

window.dispatchEvent(new Event('resize'));
render();