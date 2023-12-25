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
in vec3 a_color;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

out vec3 v_color;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
	vec4 modelViewPosition = u_viewMatrix * u_modelMatrix * a_position;
	
	v_surfaceToLight = u_lightWorldPosition - modelViewPosition.xyz;
	v_surfaceToView = u_viewWorldPosition - modelViewPosition.xyz;

	// Diffuse lighting
	vec3 normal = normalize(mat3(u_modelMatrix) * a_normal);
	float diffuseFactor = max(dot(normalize(v_surfaceToLight), normal), 0.0);
	v_color = a_color.rgb * diffuseFactor;

	v_texcoord = a_texcoord;
	v_normal = a_normal;
	gl_Position = u_projectionMatrix * modelViewPosition;
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
		'a_normal',
		'a_texcoord',
	]
);

const uniforms = glUtils.getUniformLocations(gl, shaderProgram,
	[
		'u_modelMatrix',
		'u_viewMatrix',
		'u_projectionMatrix',
		'u_texture',
		'u_lightWorldPosition',
		'u_viewWorldPosition',
	]
);

let bufferStride = 11 * Float32Array.BYTES_PER_ELEMENT;
glUtils.makeBuffer(gl,
	new Float32Array([
		// Front face
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 1, 0, 0, 1,
		 1,-1, 1, 0.5, 0.5, 0.5, 1, 1, 0, 0, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0, 0, 0, 1,
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 1, 0, 0, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0, 0, 0, 1,
		-1, 1, 1, 0.5, 0.5, 0.5, 0, 0, 0, 0, 1,

		// Back face
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1, 0, 0, -1,
		 1,-1,-1, 0.5, 0.5, 0.5, 0, 0, 0, 0, -1,
		 1, 1,-1, 0.5, 0.5, 0.5, 1, 0, 0, 0, -1,
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1, 0, 0, -1,
		 1, 1,-1, 0.5, 0.5, 0.5, 1, 0, 0, 0, -1,
		-1, 1,-1, 0.5, 0.5, 0.5, 1, 1, 0, 0, -1,

		// Top face
		-1, 1,-1, 0.5, 0.5, 0.5, 0, 1, 0, 1, 0,
		 1, 1,-1, 0.5, 0.5, 0.5, 0, 0, 0, 1, 0,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0, 0, 1, 0,
		-1, 1,-1, 0.5, 0.5, 0.5, 0, 1, 0, 1, 0,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0, 0, 1, 0,
		-1, 1, 1, 0.5, 0.5, 0.5, 1, 1, 0, 1, 0,

		// Bottom face
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1, 0, -1, 0,
		 1,-1,-1, 0.5, 0.5, 0.5, 1, 1, 0, -1, 0,
		 1,-1, 1, 0.5, 0.5, 0.5, 1, 0, 0, -1, 0,
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1, 0, -1, 0,
		 1,-1, 1, 0.5, 0.5, 0.5, 1, 0, 0, -1, 0,
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 0, 0, -1, 0,

		// Right face
		 1,-1,-1, 0.5, 0.5, 0.5, 0, 1, 1, 0, 0,
		 1, 1,-1, 0.5, 0.5, 0.5, 1, 1, 1, 0, 0,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0, 1, 0, 0,
		 1,-1,-1, 0.5, 0.5, 0.5, 0, 1, 1, 0, 0,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0, 1, 0, 0,
		 1,-1, 1, 0.5, 0.5, 0.5, 0, 0, 1, 0, 0,

		// Left face
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1, -1, 0, 0,
		-1, 1,-1, 0.5, 0.5, 0.5, 0, 0, -1, 0, 0,
		-1, 1, 1, 0.5, 0.5, 0.5, 1, 0, -1, 0, 0,
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1, -1, 0, 0,
		-1, 1, 1, 0.5, 0.5, 0.5, 1, 0, -1, 0, 0,
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 0, -1, 0, 0,
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
	attribs.a_color, 
	{
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: bufferStride,
		offset: 3 * Float32Array.BYTES_PER_ELEMENT,
	}
);

glUtils.setAttribPointer(gl,
	attribs.a_texcoord,
	{
		size: 2,
		type: gl.FLOAT,
		normalize: false,
		stride: bufferStride,
		offset: 6 * Float32Array.BYTES_PER_ELEMENT,
	}
);

glUtils.setAttribPointer(gl,
	attribs.a_normal,
	{
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: bufferStride,
		offset: 8 * Float32Array.BYTES_PER_ELEMENT,
	}
);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

var image = new Image();
image.src = 'img/myself.jpg';
image.onload = function() {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

// Model
const modelMatrix = mat4.create();
mat4.translate(modelMatrix, modelMatrix, [0, 0, -6]);

// View
let cameraPosition = [0, 0, 0];
const viewMatrix = mat4.lookAt(mat4.create(), cameraPosition, [0, 0, -6], [0, 1, 0]);

// Projection
const projectionMatrix = mat4.create();

window.addEventListener('resize', function () {
	gl.canvas.width = window.innerWidth;
	gl.canvas.height = window.innerHeight;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);
	gl.uniformMatrix4fv(uniforms.u_projectionMatrix, false, projectionMatrix);
})

gl.useProgram(shaderProgram);
let tickspeed = 0.01;
gl.enable(gl.DEPTH_TEST);
gl.cullFace(gl.BACK);

gl.uniformMatrix4fv(uniforms.u_modelMatrix, false, modelMatrix);
gl.uniformMatrix4fv(uniforms.u_viewMatrix, false, viewMatrix);
gl.uniform3fv(uniforms.u_lightWorldPosition, [2, 2, 0]);
gl.uniform3fv(uniforms.u_viewWorldPosition, cameraPosition);

window.dispatchEvent(new Event('resize'));
render();

function render() {
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	mat4.rotate(modelMatrix, modelMatrix, tickspeed, [0.5,1,1.5]);
	gl.uniformMatrix4fv(uniforms.u_modelMatrix, false, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	requestAnimationFrame(render);
}