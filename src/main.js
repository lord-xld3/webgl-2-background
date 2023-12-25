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
uniform vec3 u_diffuseColor;

out vec3 v_color;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
	vec4 modelViewPosition = u_viewMatrix * u_modelMatrix * a_position;
	
	v_surfaceToLight = normalize(u_lightWorldPosition - modelViewPosition.xyz);
	v_surfaceToView = normalize(u_viewWorldPosition - modelViewPosition.xyz);

	// Diffuse lighting
	vec3 normal = normalize(mat3(u_modelMatrix) * a_normal);
	v_color = a_color.rgb * max(dot(normal, v_surfaceToLight), 0.0);

	v_texcoord = a_texcoord;
	v_normal = normal;
	gl_Position = u_projectionMatrix * modelViewPosition;
}`;

const fsShader = `#version 300 es
precision highp float;
in vec3 v_color;
in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform sampler2D u_texture;
uniform float u_shininess;
uniform vec3 u_specularColor;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main() {
	// Specular lighting
	vec3 halfVector = normalize(v_surfaceToLight + v_surfaceToView);
	float dotFromDirection = dot(v_normal, halfVector);
	float specularFactor = pow(dotFromDirection, u_shininess);
	vec3 specular = u_specularColor * specularFactor;
	vec4 texelColor = texture(u_texture, v_texcoord);
	outColor = vec4(texelColor.rgb * (v_color + u_ambientLight) + specular, texelColor.a);
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
		'u_shininess',
		'u_specularColor',
		'u_ambientLight',
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
image.src = 'img/cobble.png';
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