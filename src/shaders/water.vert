#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform uniformStruct {
	mat4 u_modelMatrix;
	mat4 u_viewMatrix;
	mat4 u_projectionMatrix;
	float u_tick;
};

out vec2 v_texcoord;
out float v_tick;

void main() {
	vec4 modelViewPosition = u_viewMatrix * u_modelMatrix * a_position;
	gl_Position = u_projectionMatrix * modelViewPosition;
	v_texcoord = a_texcoord;
	v_tick = u_tick;
}