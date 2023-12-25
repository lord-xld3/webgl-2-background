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
in vec2 a_texcoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

out vec3 v_color;
out vec2 v_texcoord;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
	vec4 modelViewPosition = u_viewMatrix * u_modelMatrix * a_position;
	v_surfaceToLight = normalize(u_lightWorldPosition - modelViewPosition.xyz);
	v_surfaceToView = normalize(u_viewWorldPosition - modelViewPosition.xyz);
	v_texcoord = a_texcoord;
	v_color = a_color;
	gl_Position = u_projectionMatrix * modelViewPosition;
}`;

const fsShader = `#version 300 es
precision highp float;
in vec3 v_color;
in vec2 v_texcoord;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform sampler2D u_texture;
uniform sampler2D u_normalMap;
uniform float u_shininess;
uniform vec3 u_specularColor;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main() {
	// Normal mapping
	vec3 normal = texture(u_normalMap, v_texcoord).xyz * 2.0 - 1.0;
	normal = normalize(normal);

	// Diffuse lighting
	float light = dot(normal, v_surfaceToLight);
	vec3 diffuse = u_ambientLight + (v_color * light);

	// Specular lighting
	vec3 halfVector = normalize(v_surfaceToLight + v_surfaceToView);
	float dotFromDirection = dot(normal, halfVector);
	float specularFactor = pow(dotFromDirection, u_shininess);
	vec3 specular = u_specularColor * specularFactor;

	vec4 texelColor = texture(u_texture, v_texcoord);
	outColor = vec4(diffuse * texelColor.rgb + specular, texelColor.a);
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
		'u_modelMatrix',
		'u_viewMatrix',
		'u_projectionMatrix',
		'u_texture',
		'u_normalMap',
		'u_lightWorldPosition',
		'u_viewWorldPosition',
		'u_shininess',
		'u_specularColor',
		'u_ambientLight',
	]
);

let bufferStride = 8 * Float32Array.BYTES_PER_ELEMENT;
glUtils.makeBuffer(gl,
	new Float32Array([
		// Front face
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 1,
		 1,-1, 1, 0.5, 0.5, 0.5, 1, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1, 1, 1, 0.5, 0.5, 0.5, 0, 0,

		// Back face
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1,-1,-1, 0.5, 0.5, 0.5, 0, 0,
		 1, 1,-1, 0.5, 0.5, 0.5, 1, 0,
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1, 1,-1, 0.5, 0.5, 0.5, 1, 0,
		-1, 1,-1, 0.5, 0.5, 0.5, 1, 1,

		// Top face
		-1, 1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1, 1,-1, 0.5, 0.5, 0.5, 0, 0,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1, 1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1, 1, 1, 0.5, 0.5, 0.5, 1, 1,

		// Bottom face
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1,-1,-1, 0.5, 0.5, 0.5, 1, 1,
		 1,-1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1,-1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 0,

		// Right face
		 1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1, 1,-1, 0.5, 0.5, 0.5, 1, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		 1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		 1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		 1,-1, 1, 0.5, 0.5, 0.5, 0, 0,

		// Left face
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		-1, 1,-1, 0.5, 0.5, 0.5, 0, 0,
		-1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1,-1,-1, 0.5, 0.5, 0.5, 0, 1,
		-1, 1, 1, 0.5, 0.5, 0.5, 1, 0,
		-1,-1, 1, 0.5, 0.5, 0.5, 0, 0,
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

const texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);

var image = new Image();
image.src = 'img/cobble.png';
image.onload = function() {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

const normalMap = gl.createTexture();
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, normalMap);
var normalImage = new Image();
normalImage.src = 'img/cobble_normal.png';
normalImage.onload = function() {
	gl.bindTexture(gl.TEXTURE_2D, normalMap);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, normalImage);
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
let tickspeed = 0.005;
gl.enable(gl.DEPTH_TEST);
gl.cullFace(gl.BACK);

gl.uniformMatrix4fv(uniforms.u_modelMatrix, false, modelMatrix);
gl.uniformMatrix4fv(uniforms.u_viewMatrix, false, viewMatrix);
gl.uniform3fv(uniforms.u_lightWorldPosition, [1, 1, 1]);
gl.uniform3fv(uniforms.u_viewWorldPosition, cameraPosition);
gl.uniform1f(uniforms.u_shininess, 256);
gl.uniform3fv(uniforms.u_specularColor, [1, 1, 1]);
gl.uniform3fv(uniforms.u_ambientLight, [0.1, 0.1, 0.1]);
gl.uniform1i(uniforms.u_texture, 0);
gl.uniform1i(uniforms.u_normalMap, 1);

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