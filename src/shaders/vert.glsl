#version 300 es
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